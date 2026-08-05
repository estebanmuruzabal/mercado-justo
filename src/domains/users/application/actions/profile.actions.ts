'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/shared/database/supabase/server'
import { PROFILE_PATH } from '@/shared/routing/routes'

const updateProfileSchema = z.object({
  fullName: z.string().trim().max(120, 'El nombre no puede superar 120 caracteres.'),
  email: z.string().trim().email('Ingresá un email válido.').max(255),
  avatarUrl: z.string().trim().url('La URL de la foto no es válida.').nullable(),
})

export type UpdateCurrentUserProfileResult =
  | { success: true; emailChanged: boolean }
  | { success: false; error: string }

export async function updateCurrentUserProfileAction(
  input: z.input<typeof updateProfileSchema>,
): Promise<UpdateCurrentUserProfileResult> {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    if (!user) {
      return { success: false, error: 'No hay sesión activa.' }
    }

    const nextFullName = parsed.data.fullName.trim() || null
    const nextAvatarUrl = parsed.data.avatarUrl?.trim() || null
    const nextEmail = parsed.data.email.trim()
    const emailChanged = nextEmail !== (user.email ?? '')

    const { error: authError } = await supabase.auth.updateUser({
      ...(emailChanged ? { email: nextEmail } : {}),
      data: {
        full_name: nextFullName,
        avatar_url: nextAvatarUrl,
      },
    })

    if (authError) {
      throw authError
    }

    const { error: profileError } = await supabase
      .from('user' as never)
      .update({
        full_name: nextFullName,
        email: nextEmail,
        avatar_url: nextAvatarUrl,
      } as never)
      .eq('id', user.id)

    if (profileError) {
      throw profileError
    }

    revalidatePath(PROFILE_PATH)
    revalidatePath('/', 'layout')

    return { success: true, emailChanged }
  } catch (err) {
    console.error('[Profile] update failed', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudieron actualizar los datos.',
    }
  }
}
