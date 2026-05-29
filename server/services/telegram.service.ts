import { getEnvironmentBadge } from '@/lib/config/environment'
import { createServiceClient } from '@/lib/supabase/service'
import { sendMessage, TelegramApiError } from '@/lib/telegram/client'
import { VENDOR_TELEGRAM_EVENTS, type VendorTelegramEvent } from '@/lib/telegram/events'
import { buildConnectDeepLink, generateLinkToken, linkTokenExpiry } from '@/lib/telegram/link'
import type { OutboundTelegramMessage, TelegramReplyMarkup } from '@/lib/telegram/types'
import {
  getVendorTelegramSettingsService,
  mapVendorTelegramRow,
  type TelegramDbClient,
} from '@/server/queries/telegram.queries'
import type { TelegramNotificationPreferences, VendorTelegramSettings } from '@/types/telegram'

/**
 * Business logic for the vendor Telegram integration:
 * connection lifecycle (token → link → chat_id), preference updates, and the
 * generic event dispatcher used by app code and server actions.
 */

export interface ConnectLink {
  token: string
  deepLink: string
  expiresAt: string
}

export interface TelegramDispatchResult {
  delivered: boolean
  reason?: string
}

/**
 * Mint a fresh one-time connect token for a store and return the deep link the
 * vendor opens in Telegram. Existing connection state / preferences are kept.
 */
export async function createConnectLink(
  supabase: TelegramDbClient,
  storeId: string,
): Promise<ConnectLink> {
  const token = generateLinkToken()
  const expiresAt = linkTokenExpiry()

  const { error } = await supabase
    .from('vendor_telegram')
    .upsert(
      { store_id: storeId, link_token: token, link_token_expires_at: expiresAt } as never,
      { onConflict: 'store_id' },
    )

  if (error) throw error

  return { token, deepLink: buildConnectDeepLink(token), expiresAt }
}

/**
 * Resolve a `/start` token to a store and attach the Telegram chat. Runs from the
 * webhook with the service-role client. Returns the linked settings, or null when
 * the token is unknown/expired.
 */
export async function connectByToken(
  token: string,
  chatId: string | number,
  username: string | null,
): Promise<VendorTelegramSettings | null> {
  const service = createServiceClient()

  const { data: row, error } = await service
    .from('vendor_telegram')
    .select('*')
    .eq('link_token', token)
    .maybeSingle()

  if (error) throw error
  if (!row) return null

  if (row.link_token_expires_at && new Date(row.link_token_expires_at).getTime() < Date.now()) {
    return null
  }

  const { data: updated, error: updateError } = await service
    .from('vendor_telegram')
    .update({
      chat_id: String(chatId),
      username,
      connected_at: new Date().toISOString(),
      enabled: true,
      link_token: null,
      link_token_expires_at: null,
    } as never)
    .eq('store_id', row.store_id)
    .select('*')
    .single()

  if (updateError) throw updateError
  return mapVendorTelegramRow(updated)
}

/** Unlink the Telegram account from a store (keeps stored preferences). */
export async function disconnectTelegram(
  supabase: TelegramDbClient,
  storeId: string,
): Promise<void> {
  const { error } = await supabase
    .from('vendor_telegram')
    .upsert(
      {
        store_id: storeId,
        chat_id: null,
        username: null,
        connected_at: null,
        enabled: false,
        link_token: null,
        link_token_expires_at: null,
      } as never,
      { onConflict: 'store_id' },
    )

  if (error) throw error
}

/** Persist the master switch and per-event preferences for a store. */
export async function updateTelegramSettings(
  supabase: TelegramDbClient,
  storeId: string,
  values: { enabled: boolean } & TelegramNotificationPreferences,
): Promise<VendorTelegramSettings> {
  const { data, error } = await supabase
    .from('vendor_telegram')
    .upsert(
      {
        store_id: storeId,
        enabled: values.enabled,
        notify_new_orders: values.notifyNewOrders,
        notify_new_reviews: values.notifyNewReviews,
        notify_new_followers: values.notifyNewFollowers,
        notify_low_stock: values.notifyLowStock,
      } as never,
      { onConflict: 'store_id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return mapVendorTelegramRow(data)
}

function toReplyMarkup(message: OutboundTelegramMessage): TelegramReplyMarkup | undefined {
  return message.inlineKeyboard ? { inline_keyboard: message.inlineKeyboard } : undefined
}

/**
 * Generic, preference-aware event dispatcher.
 *
 * Reads the store's settings, applies the master switch + per-event preference
 * gate, builds the message from the event registry, and sends it. Never throws
 * on delivery failure — returns a structured result so callers (e.g. background
 * `after()` tasks) stay resilient.
 *
 * Uses the service-role client so it works from any context (webhooks, `after()`,
 * authenticated actions). Callers are responsible for authorizing the storeId.
 */
export async function sendVendorTelegramEvent(
  storeId: string,
  event: VendorTelegramEvent,
): Promise<TelegramDispatchResult> {
  try {
    const settings = await getVendorTelegramSettingsService(createServiceClient(), storeId)

    if (!settings.enabled) return { delivered: false, reason: 'disabled' }
    if (!settings.chatId) return { delivered: false, reason: 'not_connected' }

    const config = VENDOR_TELEGRAM_EVENTS[event.type]
    if (config.prefKey && !settings[config.prefKey]) {
      return { delivered: false, reason: 'pref_off' }
    }

    // The registry value is correctly typed per-key; the union prevents TS from
    // correlating type↔payload here, so we narrow with a localized cast.
    const message = (config.build as (p: unknown) => OutboundTelegramMessage)(event.payload)

    await sendMessage({
      chatId: settings.chatId,
      // Tag non-production messages so real users never confuse environments.
      text: `${getEnvironmentBadge()}${message.text}`,
      parseMode: message.parseMode,
      replyMarkup: toReplyMarkup(message),
    })

    return { delivered: true }
  } catch (err) {
    const reason =
      err instanceof TelegramApiError ? err.message : err instanceof Error ? err.message : 'unknown'
    console.error(`[telegram] dispatch "${event.type}" failed for store ${storeId}:`, reason)
    return { delivered: false, reason }
  }
}
