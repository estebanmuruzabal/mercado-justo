import { getTelegramBotUsername, isTelegramConfigured } from './config'
import { getWebhookInfo } from './client'
import type { TelegramMessage, TelegramUpdate, TelegramWebhookInfo } from './types'

export type TelegramWebhookState = 'CONNECTED' | 'PENDING' | 'ERROR' | 'NOT_CONFIGURED'

export type TelegramWebhookDiagnostics = {
  state: TelegramWebhookState
  configuredUrl: string | null
  pendingUpdateCount: number | null
  lastErrorDate: string | null
  lastErrorMessage: string | null
  maxConnections: number | null
  hasCustomCertificate: boolean | null
  ipAddress: string | null
  botUsername: string | null
  isConfigured: boolean
}

type RequestLogContext = {
  timestamp: string
  method: string
  url: string
  ip: string | null
  userAgent: string | null
  updateId: number | null
  updateType: string | null
}

function prefix() {
  return '[Telegram Webhook]'
}

function diagnosticsPrefix() {
  return '[Telegram Diagnostics]'
}

export function getRequestIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  return request.headers.get('x-real-ip')?.trim() || null
}

export function getTelegramUpdateType(update: TelegramUpdate): string | null {
  if (update.message) return 'message'
  if (update.callback_query) return 'callback_query'
  if (update.edited_message) return 'edited_message'
  return null
}

export function summarizeTelegramMessage(message: TelegramMessage) {
  return {
    chat: {
      id: message.chat.id,
    },
    from: message.from
      ? {
          id: message.from.id,
          username: message.from.username ?? null,
          first_name: message.from.first_name ?? null,
        }
      : null,
    text: message.text ?? null,
  }
}

export function summarizeTelegramUpdate(update: TelegramUpdate) {
  return {
    update_id: update.update_id,
    update_type: getTelegramUpdateType(update),
    message: update.message ? summarizeTelegramMessage(update.message) : null,
    edited_message: update.edited_message ? summarizeTelegramMessage(update.edited_message) : null,
    callback_query: update.callback_query
      ? {
          id: update.callback_query.id,
          from: {
            id: update.callback_query.from.id,
            username: update.callback_query.from.username ?? null,
            first_name: update.callback_query.from.first_name,
          },
          data: update.callback_query.data ?? null,
          message: update.callback_query.message ? summarizeTelegramMessage(update.callback_query.message) : null,
        }
      : null,
  }
}

export function logTelegramWebhookReceived(): void {
  console.info(`${prefix()} Telegram webhook received`)
}

export function logTelegramWebhookRequestStart(input: RequestLogContext): void {
  console.info(`${prefix()} request.start`, input)
}

export function logTelegramWebhookUpdateSummary(input: {
  updateId: number
  updateType: string | null
  message?: ReturnType<typeof summarizeTelegramMessage> | null
}): void {
  console.info(`${prefix()} update.summary`, input)
}

export function logTelegramWebhookSuccess(input: {
  updateId: number | null
  elapsedMs: number
  updateType: string | null
}): void {
  console.info(`${prefix()} Telegram webhook processed successfully`, input)
}

export function logTelegramWebhookError(input: {
  updateId: number | null
  elapsedMs: number
  message: string
  stack: string | null
  payload: unknown
}): void {
  console.error(`${prefix()} webhook error`, input)
}

function toIsoDate(epochSeconds: number | undefined): string | null {
  return typeof epochSeconds === 'number' ? new Date(epochSeconds * 1000).toISOString() : null
}

export function deriveTelegramWebhookState(info: TelegramWebhookInfo): TelegramWebhookState {
  if (!info.url) return 'NOT_CONFIGURED'
  if ((info.pending_update_count ?? 0) > 0) return 'PENDING'
  if (info.last_error_date || info.last_error_message) return 'ERROR'
  return 'CONNECTED'
}

export async function getTelegramWebhookDiagnostics(): Promise<TelegramWebhookDiagnostics> {
  if (!isTelegramConfigured()) {
    return {
      state: 'NOT_CONFIGURED',
      configuredUrl: null,
      pendingUpdateCount: null,
      lastErrorDate: null,
      lastErrorMessage: null,
      maxConnections: null,
      hasCustomCertificate: null,
      ipAddress: null,
      botUsername: null,
      isConfigured: false,
    }
  }

  const info = await getWebhookInfo()
  return {
    state: deriveTelegramWebhookState(info),
    configuredUrl: info.url || null,
    pendingUpdateCount: info.pending_update_count ?? null,
    lastErrorDate: toIsoDate(info.last_error_date),
    lastErrorMessage: info.last_error_message ?? null,
    maxConnections: info.max_connections ?? null,
    hasCustomCertificate: info.has_custom_certificate ?? null,
    ipAddress: info.ip_address ?? null,
    botUsername: getTelegramBotUsername(),
    isConfigured: true,
  }
}

export function logTelegramDiagnosticsReport(diagnostics: TelegramWebhookDiagnostics): void {
  console.info(`${diagnosticsPrefix()} report`, diagnostics)
}
