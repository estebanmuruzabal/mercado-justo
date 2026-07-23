import { USER_TELEGRAM_START_PAYLOAD_PREFIX } from './constants'

export { USER_TELEGRAM_START_PAYLOAD_PREFIX } from './constants'

/** Client-safe: build `/start` payload without server env. */
export function buildUserStartPayload(token: string): string {
  return `${USER_TELEGRAM_START_PAYLOAD_PREFIX}${token}`
}

/** Client-safe: parse `connect_<token>` from a `/start` payload. */
export function parseUserStartPayload(payload: string | undefined | null): string | null {
  if (!payload) return null
  const trimmed = payload.trim()
  if (!trimmed.startsWith(USER_TELEGRAM_START_PAYLOAD_PREFIX)) return null
  const token = trimmed.slice(USER_TELEGRAM_START_PAYLOAD_PREFIX.length)
  return /^[A-Za-z0-9_-]+$/.test(token) ? token : null
}

/** Client-safe guardrail: deep links must embed connect_<token>, never a bare ?start. */
export function isValidUserConnectDeepLink(deepLink: string): boolean {
  try {
    const url = new URL(deepLink)
    if (url.protocol !== 'https:' || url.hostname !== 't.me') return false

    const start = url.searchParams.get('start')
    if (!start) return false

    const token = parseUserStartPayload(start)
    return Boolean(token && token.length >= 16)
  } catch {
    return false
  }
}
