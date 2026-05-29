import { getSiteUrl, isHttpsSiteUrl } from '@/lib/config/environment'
import { env } from '@/lib/env'

/**
 * Centralized access to Telegram-related configuration.
 *
 * Everything is resolved lazily so the app can build and run without Telegram
 * configured; callers that actually need a value get a clear, actionable error.
 */

export const TELEGRAM_START_PAYLOAD_PREFIX = 'vendor_'

/** Server-only bot token from @BotFather. Throws if not configured. */
export function getTelegramBotToken(): string {
  const token = env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error(
      'TELEGRAM_BOT_TOKEN is not configured. Add it to your environment to enable Telegram notifications.',
    )
  }
  return token
}

/** Bot username (without "@"). Throws if not configured. */
export function getTelegramBotUsername(): string {
  const username = env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
  if (!username) {
    throw new Error(
      'NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not configured. Set it to your bot username (without "@").',
    )
  }
  return username.replace(/^@/, '')
}

/** Optional shared secret used to authenticate inbound webhook requests. */
export function getTelegramWebhookSecret(): string | null {
  return env.TELEGRAM_WEBHOOK_SECRET ?? null
}

/** True when the integration has the minimum config required to send messages. */
export function isTelegramConfigured(): boolean {
  return Boolean(env.TELEGRAM_BOT_TOKEN && env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)
}

/**
 * Telegram only accepts https URLs in inline keyboard `url` buttons. Returns the
 * absolute URL when the site is served over https, otherwise null (so callers can
 * gracefully omit the button in local/http environments). Uses the centralized
 * site URL resolver — never hardcode URLs here.
 */
export function buildHttpsUrl(path: string): string | null {
  if (!isHttpsSiteUrl()) return null
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
