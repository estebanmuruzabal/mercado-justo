/**
 * Domain types for the vendor Telegram notifications integration.
 *
 * These are camelCase app-level types mapped from the snake_case
 * `vendor_telegram` table rows (see server/queries/telegram.queries.ts).
 */

/** Per-event opt-in flags. Keys must stay in sync with {@link TELEGRAM_EVENT_PREF_KEYS}. */
export interface TelegramNotificationPreferences {
  notifyNewOrders: boolean
  notifyNewReviews: boolean
  notifyNewFollowers: boolean
  notifyLowStock: boolean
}

/** Full integration state for a single vendor, as consumed by the UI. */
export interface VendorTelegramSettings extends TelegramNotificationPreferences {
  storeId: string
  /** Telegram chat id the bot delivers messages to. Null until connected. */
  chatId: string | null
  /** Public Telegram @username of the connected account (without "@"). */
  username: string | null
  /** Master switch. When false, no Telegram messages are sent. */
  enabled: boolean
  /** Derived: a chat is linked. */
  connected: boolean
  /** ISO timestamp of when the account was linked. */
  connectedAt: string | null
}

/** Default settings for a vendor that has never opened the Telegram section. */
export function defaultVendorTelegramSettings(storeId: string): VendorTelegramSettings {
  return {
    storeId,
    chatId: null,
    username: null,
    enabled: false,
    connected: false,
    connectedAt: null,
    notifyNewOrders: true,
    notifyNewReviews: true,
    notifyNewFollowers: true,
    notifyLowStock: true,
  }
}
