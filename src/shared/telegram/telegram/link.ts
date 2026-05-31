import { randomBytes } from 'node:crypto'

import { getTelegramBotUsername, TELEGRAM_START_PAYLOAD_PREFIX } from './config'

/**
 * Deep-link + connect-token helpers.
 *
 * The connection flow uses a one-time, short-lived token instead of the raw
 * store id so a malicious actor cannot link their Telegram to someone else's
 * store by guessing ids. The Telegram `start` payload is limited to 64 chars
 * matching `[A-Za-z0-9_-]`, which our `vendor_<hex>` payload respects.
 */

/** Lifetime of a connect token before it must be regenerated. */
export const TELEGRAM_LINK_TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutes

/** Generate a cryptographically-random connect token (url-safe). */
export function generateLinkToken(): string {
  return randomBytes(24).toString('hex')
}

/** ISO timestamp for when a freshly minted token expires. */
export function linkTokenExpiry(now: Date = new Date()): string {
  return new Date(now.getTime() + TELEGRAM_LINK_TOKEN_TTL_MS).toISOString()
}

/** Build the full Telegram `start` payload for a token. */
export function buildStartPayload(token: string): string {
  return `${TELEGRAM_START_PAYLOAD_PREFIX}${token}`
}

/**
 * Parse a `/start` payload, returning the embedded token or null when the
 * payload is missing or does not match our expected prefix.
 */
export function parseStartPayload(payload: string | undefined | null): string | null {
  if (!payload) return null
  const trimmed = payload.trim()
  if (!trimmed.startsWith(TELEGRAM_START_PAYLOAD_PREFIX)) return null
  const token = trimmed.slice(TELEGRAM_START_PAYLOAD_PREFIX.length)
  return /^[A-Za-z0-9_-]+$/.test(token) ? token : null
}

/** Build the public deep link a vendor opens to connect their account. */
export function buildConnectDeepLink(token: string): string {
  const username = getTelegramBotUsername()
  return `https://t.me/${username}?start=${buildStartPayload(token)}`
}
