import { env } from '@/shared/config/env'

/** Default Resend test sender (only delivers to the Resend account owner). */
export const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev'

/**
 * Centralized access to Resend-related configuration.
 *
 * Lazy / optional so the app builds and runs without email configured.
 */
export function getResendApiKey(): string {
  const key = env.RESEND_API_KEY
  if (!key) {
    throw new Error(
      'RESEND_API_KEY is not configured. Add it to your environment to enable operational emails.',
    )
  }
  return key
}

export function getFromEmail(): string {
  return env.RESEND_FROM_EMAIL ?? DEFAULT_FROM_EMAIL
}

export function getReplyToEmail(): string | undefined {
  return env.RESEND_REPLY_TO
}

/** True when the integration has the minimum config required to send emails. */
export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY)
}
