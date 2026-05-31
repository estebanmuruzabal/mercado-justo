// Server-only module: imports the Resend API key and must never reach the client bundle.
import { Resend } from 'resend'

import { getResendApiKey } from './config'

let client: Resend | null = null
/** Lazy singleton Resend client (server-only). */
export function getResendClient(): Resend {
  console.log('getResendApiKey()', getResendApiKey())

  if (!client) {
    client = new Resend(getResendApiKey())
  }
  return client
}
