// Server-only module: imports the bot token and must never reach the client bundle.
import { getTelegramBotToken } from './config'
import type {
  SendMessageParams,
  TelegramApiResponse,
  TelegramMessage,
} from './types'

/**
 * Thin, dependency-free client for the Telegram Bot API.
 *
 * Server-only. All methods return typed results and throw {@link TelegramApiError}
 * on transport or API-level failures so callers can decide how to handle them.
 */

const TELEGRAM_API_BASE = 'https://api.telegram.org'
const DEFAULT_TIMEOUT_MS = 10_000

export class TelegramApiError extends Error {
  readonly method: string
  readonly code?: number

  constructor(method: string, message: string, code?: number) {
    super(`Telegram API "${method}" failed: ${message}`)
    this.name = 'TelegramApiError'
    this.method = method
    this.code = code
  }
}

async function callTelegram<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const token = getTelegramBotToken()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (err) {
    throw new TelegramApiError(
      method,
      err instanceof Error ? err.message : 'network error',
    )
  } finally {
    clearTimeout(timeout)
  }

  let payload: TelegramApiResponse<T>
  try {
    payload = (await res.json()) as TelegramApiResponse<T>
  } catch {
    throw new TelegramApiError(method, `invalid JSON response (HTTP ${res.status})`, res.status)
  }

  if (!payload.ok || payload.result === undefined) {
    throw new TelegramApiError(
      method,
      payload.description ?? `HTTP ${res.status}`,
      payload.error_code ?? res.status,
    )
  }

  return payload.result
}

/** Send a message to a chat. Returns the sent message on success. */
export async function sendMessage(params: SendMessageParams): Promise<TelegramMessage> {
  return callTelegram<TelegramMessage>('sendMessage', {
    chat_id: params.chatId,
    text: params.text,
    parse_mode: params.parseMode ?? 'HTML',
    disable_web_page_preview: params.disableWebPagePreview ?? true,
    ...(params.replyMarkup ? { reply_markup: params.replyMarkup } : {}),
  })
}

/** Acknowledge a callback query (removes the loading spinner on the inline button). */
export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  await callTelegram<boolean>('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  })
}

/** Register the webhook URL with Telegram (used by scripts/ops, not at runtime). */
export async function setWebhook(url: string, secretToken?: string): Promise<boolean> {
  return callTelegram<boolean>('setWebhook', {
    url,
    allowed_updates: ['message', 'callback_query'],
    ...(secretToken ? { secret_token: secretToken } : {}),
  })
}

/** Remove the registered webhook. */
export async function deleteWebhook(): Promise<boolean> {
  return callTelegram<boolean>('deleteWebhook', { drop_pending_updates: false })
}
