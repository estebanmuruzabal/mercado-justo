/**
 * Domain types for Telegram account linking + vendor notification prefs.
 *
 * Mapped from snake_case `vendor_telegram` rows (user-scoped; historically store-scoped).
 */

export type TelegramConnectionStatus = 'pending' | 'connected' | 'expired'

/** Per-event opt-in flags. Keys must stay in sync with {@link TELEGRAM_EVENT_PREF_KEYS}. */
export interface TelegramNotificationPreferences {
  notifyNewOrders: boolean
  notifyNewReviews: boolean
  notifyNewFollowers: boolean
  notifyLowStock: boolean
}

/** Full integration state for a single user, as consumed by the UI. */
export interface UserTelegramSettings extends TelegramNotificationPreferences {
  userId: string
  /** @deprecated Alias of userId for vendor UI compatibility (store.id === user.id). */
  storeId: string
  /** Telegram chat id the bot delivers messages to. Null until connected. */
  chatId: string | null
  /** Telegram platform user id. */
  telegramUserId: string | null
  /** Public Telegram @username of the connected account (without "@"). */
  username: string | null
  firstName: string | null
  /** Connect-token lifecycle status. */
  status: TelegramConnectionStatus
  /** Master switch. When false, no Telegram messages are sent. */
  enabled: boolean
  /** Derived: a chat is linked. */
  connected: boolean
  /** ISO timestamp of when the account was linked. */
  connectedAt: string | null
}

/** @deprecated Prefer {@link UserTelegramSettings}. */
export type VendorTelegramSettings = UserTelegramSettings

/** Default settings for a user that has never opened the Telegram section. */
export function defaultUserTelegramSettings(userId: string): UserTelegramSettings {
  return {
    userId,
    storeId: userId,
    chatId: null,
    telegramUserId: null,
    username: null,
    firstName: null,
    status: 'expired',
    enabled: false,
    connected: false,
    connectedAt: null,
    notifyNewOrders: true,
    notifyNewReviews: true,
    notifyNewFollowers: true,
    notifyLowStock: true,
  }
}

/** @deprecated Prefer {@link defaultUserTelegramSettings}. */
export function defaultVendorTelegramSettings(storeId: string): UserTelegramSettings {
  return defaultUserTelegramSettings(storeId)
}
