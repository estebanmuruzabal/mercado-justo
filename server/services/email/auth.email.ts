import { isEmailConfigured } from '@/lib/notifications/email/config'
import { emailElement, sendEmail } from '@/lib/notifications/email/send'
import type { DeliveryResult } from '@/lib/notifications/channels/types'
import { PasswordResetEmail } from '@/emails/password-reset'

export type PasswordResetFallbackInput = {
  to: string
  resetUrl: string
  expiresInMinutes?: number
}

/**
 * Fallback password reset email via Resend when Supabase Auth email is unavailable.
 * Primary recovery flow uses Supabase native `resetPasswordForEmail`.
 */
export async function sendPasswordResetFallbackEmail(
  input: PasswordResetFallbackInput,
): Promise<DeliveryResult> {
  console.log('sendPasswordResetFallbackEmail()', input)

  if (!isEmailConfigured()) return { delivered: false, reason: 'not_configured' }
  return sendEmail({
    to: input.to,
    subject: 'Restablecer contraseña — Mercado Justo',
    react: emailElement(PasswordResetEmail, {
      resetUrl: input.resetUrl,
      expiresInMinutes: input.expiresInMinutes ?? 60,
    }),
  })
}
