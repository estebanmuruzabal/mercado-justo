'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { publicVendorPath } from '@/lib/routes'

const upsertReviewSchema = z.object({
  storeId: z.string().uuid(),
  slug: z.string().min(1),
  rating: z.number().int().min(1, 'Elegí una puntuación.').max(5),
  comment: z
    .string()
    .trim()
    .max(1000, 'El comentario es demasiado largo.')
    .optional()
    .transform((v) => (v && v.length ? v : null)),
})

export type ReviewActionResult = { success: true } | { success: false; error: string }

export async function upsertVendorReviewAction(
  input: z.input<typeof upsertReviewSchema>,
): Promise<ReviewActionResult> {
  try {
    const parsed = upsertReviewSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Iniciá sesión para dejar una reseña.' }

    const { storeId, slug, rating, comment } = parsed.data
    if (user.id === storeId) {
      return { success: false, error: 'No podés reseñar tu propia tienda.' }
    }

    // Denormalize the author identity (public."user" RLS hides other profiles).
    const { data: profile } = await supabase
      .from('user' as never)
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    const typedProfile = profile as { full_name: string | null; avatar_url: string | null } | null

    const { error } = await supabase.from('store_review').upsert(
      {
        store_id: storeId,
        author_id: user.id,
        author_name: typedProfile?.full_name ?? user.email ?? 'Usuario',
        author_avatar_url: typedProfile?.avatar_url ?? null,
        rating,
        comment,
      } as never,
      { onConflict: 'store_id,author_id' },
    )

    if (error) throw error

    revalidatePath(publicVendorPath(slug))
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo guardar la reseña.' }
  }
}

export async function deleteVendorReviewAction(input: {
  storeId: string
  slug: string
}): Promise<ReviewActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Iniciá sesión.' }

    const { error } = await supabase
      .from('store_review')
      .delete()
      .eq('store_id', input.storeId)
      .eq('author_id', user.id)

    if (error) throw error

    revalidatePath(publicVendorPath(input.slug))
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo eliminar la reseña.' }
  }
}
