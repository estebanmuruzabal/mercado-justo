import type { TelegramUpdate } from './types'
import { summarizeTelegramUpdate } from './webhook-observability'

/**
 * Diagnostic logging for the end-user Telegram connect flow.
 */

const PREFIX = '[Telegram Webhook]'

type DebugPayload = Record<string, unknown>

function emit(step: string, payload: DebugPayload = {}): void {
  console.info(`${PREFIX} ${step}`, payload)
}

export function logTelegramWebhookUpdate(update: TelegramUpdate): void {
  emit('webhook.update.received', summarizeTelegramUpdate(update))
}

export function logTelegramStartMessage(input: {
  messageText: string
  command: string
  rawPayload: string
  parsedConnectToken: string | null
  chatId: number
  fromId: number | null
  username: string | null
}): void {
  emit('webhook.message.start', input)
}

export function logTelegramUserConnectAttempt(input: {
  token: string
  chatId: number
  telegramUserId: number
  username: string | null
}): void {
  emit('webhook.user_connect.attempt', input)
}

export function logTelegramUserConnectTokenLookup(input: {
  token: string
  found: boolean
  userId: string | null
  linkTokenExpiresAt: string | null
  existingChatId: string | null
  dbError: string | null
}): void {
  emit('webhook.user_connect.token_lookup', input)
}

export function logTelegramUserConnectTokenStatus(input: {
  token: string
  status: 'valid' | 'expired' | 'invalid' | 'chat_taken'
  reason: string
}): void {
  emit('webhook.user_connect.token_status', input)
}

export function logTelegramUserConnectUpdate(input: {
  userId: string
  token: string
  updateAttempted: boolean
  updateSucceeded: boolean
  dbError: string | null
  chatId: string | null
  telegramUserId: string | null
  username: string | null
  connectedAt: string | null
}): void {
  emit('webhook.user_connect.db_update', input)
}

export function logTelegramUserConnectFinal(input: {
  userId: string | null
  resultStatus: string
  telegramConnected: boolean
  telegramChatId: string | null
  telegramUserId: string | null
  telegramUsername: string | null
  telegramConnectedAt: string | null
}): void {
  emit('webhook.user_connect.final', input)
}
