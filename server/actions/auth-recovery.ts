'use server'

import { absoluteUrl } from '@/lib/config/environment'
import { mapAuthErrorMessage } from '@/lib/auth/errors'
import { createClient } from '@/lib/supabase/server'
import { AUTH_CALLBACK_PATH, RESET_PASSWORD_PATH } from '@/lib/routes'

export type PasswordRecoveryResult =
  | { ok: true; message: string }
  | { error: string }

function passwordResetRedirectUrl(): string {
  const next = encodeURIComponent(RESET_PASSWORD_PATH)
  return absoluteUrl(`${AUTH_CALLBACK_PATH}?next=${next}`)
}

/** Request a password reset link via Supabase Auth (native email). */
export async function requestPasswordReset(email: string): Promise<PasswordRecoveryResult> {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) {
    return { error: 'Ingresá tu email.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: passwordResetRedirectUrl(),
  })

  if (error) {
    return { error: mapAuthErrorMessage(error.message) }
  }

  return {
    ok: true,
    message:
      'Si existe una cuenta con ese email, te enviamos un enlace para restablecer la contraseña.',
  }
}

/** Set a new password after the user followed the recovery link. */
export async function updatePassword(password: string): Promise<PasswordRecoveryResult> {
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'La sesión de recuperación expiró. Pedí un nuevo enlace.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: mapAuthErrorMessage(error.message) }
  }

  return {
    ok: true,
    message: 'Contraseña actualizada. Ya podés iniciar sesión.',
  }
}
