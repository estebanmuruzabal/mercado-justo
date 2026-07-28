import {
  TELEGRAM_LINK_TOKEN_TTL_MS,
  TELEGRAM_START_PAYLOAD_PREFIX,
} from './constants'

/**
 * Pure payload helpers (no env / BotFather username). Safe for unit tests and client.
 */

export function linkTokenExpiry(now: Date = new Date()): string {
  return new Date(now.getTime() + TELEGRAM_LINK_TOKEN_TTL_MS).toISOString()
}

export function buildStartPayload(token: string): string {
  return `${TELEGRAM_START_PAYLOAD_PREFIX}${token}`
}

export function parseStartPayload(payload: string | undefined | null): string | null {
  if (!payload) return null
  const trimmed = payload.trim()
  if (!trimmed.startsWith(TELEGRAM_START_PAYLOAD_PREFIX)) return null
  const token = trimmed.slice(TELEGRAM_START_PAYLOAD_PREFIX.length)
  return /^[A-Za-z0-9_-]+$/.test(token) ? token : null
}
