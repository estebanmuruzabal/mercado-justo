import { randomBytes } from 'node:crypto'

import { getTelegramBotUsername } from './config'
import {
  buildStartPayload,
  linkTokenExpiry,
  parseStartPayload,
} from './link-payload'

export {
  TELEGRAM_LINK_TOKEN_TTL_MS,
  TELEGRAM_START_PAYLOAD_PREFIX,
} from './constants'
export { buildStartPayload, linkTokenExpiry, parseStartPayload }

/**
 * Deep-link + connect-token helpers.
 *
 * The connection flow uses a one-time, short-lived token instead of the raw
 * user id so a malicious actor cannot link their Telegram to someone else's
 * account by guessing ids. The Telegram `start` payload is limited to 64 chars
 * matching `[A-Za-z0-9_-]`, which our `connect_<hex>` payload respects.
 */

/** Generate a cryptographically-random connect token (url-safe). */
export function generateLinkToken(): string {
  return randomBytes(24).toString('hex')
}

/** Build the public deep link a user opens to connect their account. */
export function buildConnectDeepLink(token: string): string {
  const username = getTelegramBotUsername()
  return `https://t.me/${username}?start=${buildStartPayload(token)}`
}
