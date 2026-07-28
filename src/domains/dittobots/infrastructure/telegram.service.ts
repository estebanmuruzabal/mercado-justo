import { getEnvironmentBadge } from '@/shared/config/environment'
import { createServiceClient } from '@/shared/database/supabase/service'
import { sendMessage, TelegramApiError } from '@/shared/telegram/telegram/client'
import { VENDOR_TELEGRAM_EVENTS, type VendorTelegramEvent } from '@/shared/telegram/telegram/events'
import { buildConnectDeepLink, generateLinkToken, linkTokenExpiry } from '@/shared/telegram/telegram/link'
import type { OutboundTelegramMessage, TelegramReplyMarkup } from '@/shared/telegram/telegram/types'
import {
  getUserTelegramSettingsService,
  mapUserTelegramRow,
  type TelegramDbClient,
} from '@/domains/dittobots/application/queries/telegram.queries'
import type {
  TelegramNotificationPreferences,
  UserTelegramSettings,
} from '@/domains/dittobots/domain/vendor-telegram-settings'

/**
 * Business logic for Telegram account linking (any authenticated user) and
 * vendor notification preferences / event dispatch.
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

export type ConnectByTokenResult =
  | { status: 'connected'; settings: UserTelegramSettings }
  | { status: 'already_connected'; settings: UserTelegramSettings }
  | { status: 'invalid_token' }
  | { status: 'expired_token' }
  | { status: 'chat_taken' }

export interface SendTelegramMessageResult {
  delivered: boolean
  reason?: 'not_connected' | 'send_failed' | string
}

function maskToken(token: string): string {
  if (token.length <= 6) return '******'
  return `…${token.slice(-6)}`
}

/**
 * Mint a fresh one-time connect token for a user and return the deep link.
 * Invalidates any previous pending token for the same user.
 */
export async function createConnectLink(
  supabase: TelegramDbClient,
  userId: string,
): Promise<ConnectLink> {
  const token = generateLinkToken()
  const expiresAt = linkTokenExpiry()

  const { error } = await supabase
    .from('vendor_telegram')
    .upsert(
      {
        user_id: userId,
        link_token: token,
        link_token_expires_at: expiresAt,
        status: 'pending',
      } as never,
      { onConflict: 'user_id' },
    )

  if (error) throw error

  const deepLink = buildConnectDeepLink(token)
  console.info('[Telegram Connect] token generated', {
    userId,
    tokenSuffix: maskToken(token),
    expiresAt,
    deepLink,
  })

  return { token, deepLink, expiresAt }
}

/**
 * Resolve a `/start` token to a user and attach the Telegram chat.
 * Runs from the webhook with the service-role client.
 */
export async function connectByToken(
  token: string,
  chatId: string | number,
  username: string | null,
  telegramUserId?: string | null,
  firstName?: string | null,
): Promise<ConnectByTokenResult> {
  const service = createServiceClient()
  const chatIdStr = String(chatId)
  const telegramUserIdStr = telegramUserId != null ? String(telegramUserId) : null

  console.info('[Telegram Webhook] connect token received', {
    tokenSuffix: maskToken(token),
    chatId: chatIdStr,
    telegramUserId: telegramUserIdStr,
    username,
  })

  const { data: row, error } = await service
    .from('vendor_telegram')
    .select('*')
    .eq('link_token', token)
    .maybeSingle()

  if (error) throw error
  if (!row) {
    console.info('[Telegram Webhook] invalid_token', { tokenSuffix: maskToken(token) })
    return { status: 'invalid_token' }
  }

  if (row.link_token_expires_at && new Date(row.link_token_expires_at).getTime() < Date.now()) {
    await service
      .from('vendor_telegram')
      .update({ status: 'expired', link_token: null, link_token_expires_at: null } as never)
      .eq('user_id', row.user_id)
    console.info('[Telegram Webhook] expired_token', {
      userId: row.user_id,
      tokenSuffix: maskToken(token),
    })
    return { status: 'expired_token' }
  }

  if (row.status !== 'pending') {
    console.info('[Telegram Webhook] invalid_token (not pending)', {
      userId: row.user_id,
      status: row.status,
    })
    return { status: 'invalid_token' }
  }

  // Idempotent: same user already linked to this chat.
  if (
    row.chat_id === chatIdStr &&
    (!telegramUserIdStr || row.telegram_user_id === telegramUserIdStr)
  ) {
    const settings = mapUserTelegramRow({
      ...row,
      status: 'connected',
      connected_at: row.connected_at ?? new Date().toISOString(),
    })
    console.info('[Telegram Webhook] already_connected', { userId: row.user_id })
    return { status: 'already_connected', settings }
  }

  // Reject if chat or telegram user is already linked to another Mercado Justo user.
  const conflictFilters: string[] = [`chat_id.eq.${chatIdStr}`]
  if (telegramUserIdStr) conflictFilters.push(`telegram_user_id.eq.${telegramUserIdStr}`)

  const { data: conflicts, error: conflictError } = await service
    .from('vendor_telegram')
    .select('user_id, chat_id, telegram_user_id')
    .or(conflictFilters.join(','))
    .neq('user_id', row.user_id)

  if (conflictError) throw conflictError
  if (conflicts && conflicts.length > 0) {
    console.info('[Telegram Webhook] chat_taken', {
      userId: row.user_id,
      chatId: chatIdStr,
      telegramUserId: telegramUserIdStr,
    })
    return { status: 'chat_taken' }
  }

  const connectedAt = new Date().toISOString()
  const { data: updated, error: updateError } = await service
    .from('vendor_telegram')
    .update({
      chat_id: chatIdStr,
      telegram_user_id: telegramUserIdStr,
      username,
      first_name: firstName ?? null,
      connected_at: connectedAt,
      enabled: true,
      status: 'connected',
      link_token: null,
      link_token_expires_at: null,
    } as never)
    .eq('user_id', row.user_id)
    .eq('link_token', token)
    .select('*')
    .single()

  if (updateError) throw updateError

  const settings = mapUserTelegramRow(updated)
  console.info('[Telegram Webhook] connection created', {
    userId: settings.userId,
    chatId: settings.chatId,
    telegramUserId: settings.telegramUserId,
    username: settings.username,
  })

  return { status: 'connected', settings }
}

/** Unlink the Telegram account from a user (keeps stored preferences). */
export async function disconnectTelegram(
  supabase: TelegramDbClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('vendor_telegram')
    .upsert(
      {
        user_id: userId,
        chat_id: null,
        telegram_user_id: null,
        username: null,
        first_name: null,
        connected_at: null,
        enabled: false,
        status: 'expired',
        link_token: null,
        link_token_expires_at: null,
      } as never,
      { onConflict: 'user_id' },
    )

  if (error) throw error
  console.info('[Telegram Connect] disconnected', { userId })
}

/** Persist the master switch and per-event preferences for a user (vendor prefs). */
export async function updateTelegramSettings(
  supabase: TelegramDbClient,
  userId: string,
  values: { enabled: boolean } & TelegramNotificationPreferences,
): Promise<UserTelegramSettings> {
  const { data, error } = await supabase
    .from('vendor_telegram')
    .upsert(
      {
        user_id: userId,
        enabled: values.enabled,
        notify_new_orders: values.notifyNewOrders,
        notify_new_reviews: values.notifyNewReviews,
        notify_new_followers: values.notifyNewFollowers,
        notify_low_stock: values.notifyLowStock,
      } as never,
      { onConflict: 'user_id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return mapUserTelegramRow(data)
}

function toReplyMarkup(message: OutboundTelegramMessage): TelegramReplyMarkup | undefined {
  return message.inlineKeyboard ? { inline_keyboard: message.inlineKeyboard } : undefined
}

/**
 * Send a plain text message to a linked Mercado Justo user via Telegram.
 */
export async function sendTelegramMessage(
  userId: string,
  message: string,
): Promise<SendTelegramMessageResult> {
  try {
    const settings = await getUserTelegramSettingsService(createServiceClient(), userId)
    if (!settings.connected || !settings.chatId) {
      return { delivered: false, reason: 'not_connected' }
    }

    await sendMessage({
      chatId: settings.chatId,
      text: `${getEnvironmentBadge()}${message}`,
    })

    return { delivered: true }
  } catch (err) {
    const reason =
      err instanceof TelegramApiError ? err.message : err instanceof Error ? err.message : 'send_failed'
    console.error('[Telegram Connect] sendTelegramMessage failed', { userId, reason })
    return { delivered: false, reason }
  }
}

/**
 * Generic, preference-aware vendor event dispatcher.
 * `storeId` is the seller user id (store.id === user.id).
 */
export async function sendVendorTelegramEvent(
  storeId: string,
  event: VendorTelegramEvent,
): Promise<TelegramDispatchResult> {
  try {
    const settings = await getUserTelegramSettingsService(createServiceClient(), storeId)

    if (!settings.enabled) return { delivered: false, reason: 'disabled' }
    if (!settings.chatId) return { delivered: false, reason: 'not_connected' }

    const config = VENDOR_TELEGRAM_EVENTS[event.type]
    if (config.prefKey && !settings[config.prefKey as keyof TelegramNotificationPreferences]) {
      return { delivered: false, reason: 'pref_off' }
    }

    const message = (config.build as (p: unknown) => OutboundTelegramMessage)(event.payload)

    await sendMessage({
      chatId: settings.chatId,
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
