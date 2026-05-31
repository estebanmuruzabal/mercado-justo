/**
 * Minimal, strongly-typed subset of the Telegram Bot API surface we rely on.
 * See https://core.telegram.org/bots/api. Extend as new features are added.
 */

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  first_name?: string
  last_name?: string
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

/** A single inbound update. We only model the fields the webhook consumes. */
export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

/** Inline keyboard button (url or callback). */
export interface TelegramInlineButton {
  text: string
  url?: string
  callback_data?: string
}

export type TelegramInlineKeyboard = TelegramInlineButton[][]

export interface TelegramReplyMarkup {
  inline_keyboard: TelegramInlineKeyboard
}

export type TelegramParseMode = 'HTML' | 'MarkdownV2' | 'Markdown'

export interface SendMessageParams {
  chatId: string | number
  text: string
  parseMode?: TelegramParseMode
  replyMarkup?: TelegramReplyMarkup
  disableWebPagePreview?: boolean
}

/** Envelope returned by every Bot API method. */
export interface TelegramApiResponse<T> {
  ok: boolean
  result?: T
  error_code?: number
  description?: string
}

/** Normalized outbound message produced by message/event builders. */
export interface OutboundTelegramMessage {
  text: string
  parseMode: TelegramParseMode
  inlineKeyboard?: TelegramInlineKeyboard
}
