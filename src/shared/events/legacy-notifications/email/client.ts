// Server-only module: imports the Resend API key and must never reach the client bundle.
import { Resend } from 'resend'

import { createLogger } from '@/shared/lib/logger/logger'

import { getResendApiKey } from './config'

const logEmail = createLogger('email.resend')

let client: Resend | null = null
/** Lazy singleton Resend client (server-only). */
export function getResendClient(): Resend {
  logEmail.trace('initializing resend client', { configured: Boolean(getResendApiKey()) })

  if (!client) {
    client = new Resend(getResendApiKey())
  }
  return client
}
