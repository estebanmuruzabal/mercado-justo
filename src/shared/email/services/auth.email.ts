import { isEmailConfigured } from '@/shared/events/legacy-notifications/email/config'
import { emailElement, sendEmail } from '@/shared/events/legacy-notifications/email/send'
import type { DeliveryResult } from '@/shared/events/legacy-notifications/channels/types'
import { PasswordResetEmail } from '@/emails/password-reset'
import { createLogger } from '@/shared/lib/logger/logger'

const logAuthEmail = createLogger('email.auth')

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
  logAuthEmail.debug('sending password reset fallback email', {
    configured: isEmailConfigured(),
    expiresInMinutes: input.expiresInMinutes ?? 60,
  })

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
