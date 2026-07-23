import { getTelegramBotUsername } from './config'
import { buildUserStartPayload } from './user-link-payload'

export {
  buildUserStartPayload,
  isValidUserConnectDeepLink,
  parseUserStartPayload,
  USER_TELEGRAM_START_PAYLOAD_PREFIX,
} from './user-link-payload'

/** Server-only: build the public deep link for end-user Telegram connect. */
export function buildUserConnectDeepLink(token: string): string {
  if (!token?.trim()) {
    throw new Error('Telegram connect token is required to build the deep link.')
  }

  const username = getTelegramBotUsername()
  const startPayload = buildUserStartPayload(token)
  return `https://t.me/${username}?start=${encodeURIComponent(startPayload)}`
}
