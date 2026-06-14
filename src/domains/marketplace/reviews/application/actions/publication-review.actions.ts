'use server'

import { z } from 'zod'
import { createClient } from '@/shared/database/supabase/server'
import { dispatchNotificationEvent } from '@/shared/events/bus/dispatch'

const reviewSchema = z.object({
  publicationId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
})

export async function upsertPublicationReviewAction(
  input: z.infer<typeof reviewSchema>,
): Promise<{ success: true; reviewId: string } | { success: false; error: string }> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid review' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const { data, error } = await supabase
    .from('publication_review')
    .upsert(
      {
        publication_id: parsed.data.publicationId,
        author_id: user.id,
        rating: parsed.data.rating,
        body: parsed.data.body ?? null,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: 'publication_id,author_id' },
    )
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: error?.message ?? 'No se pudo guardar la reseña.' }
  }

  await dispatchNotificationEvent({
    type: 'marketplace.review.created',
    payload: {
      publicationId: parsed.data.publicationId,
      reviewId: (data as { id: string }).id,
      authorId: user.id,
    },
  })

  return { success: true, reviewId: (data as { id: string }).id }
}

export async function listPublicationReviews(publicationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('publication_review')
    .select('id, rating, body, created_at, author_id')
    .eq('publication_id', publicationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
