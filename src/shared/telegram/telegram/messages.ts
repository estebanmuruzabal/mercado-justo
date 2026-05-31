import type { TelegramInlineButton, TelegramInlineKeyboard } from './types'

/**
 * Message formatting helpers. We send messages with `parse_mode: HTML`, which
 * requires escaping `<`, `>` and `&` in any user-provided/dynamic text.
 */

/** Escape text for safe interpolation into an HTML-parsed Telegram message. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function bold(value: string): string {
  return `<b>${escapeHtml(value)}</b>`
}

/** Format a number as a localized currency-ish amount (ARS-style, no decimals). */
export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0
  return `$${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(safe)}`
}

/** Join non-empty lines into a single message body. */
export function lines(...parts: Array<string | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p)).join('\n')
}

/** Build a single-row inline keyboard from buttons, omitting nulls. */
export function inlineKeyboard(
  ...rows: Array<Array<TelegramInlineButton | null>>
): TelegramInlineKeyboard | undefined {
  const cleaned = rows
    .map((row) => row.filter((b): b is TelegramInlineButton => Boolean(b)))
    .filter((row) => row.length > 0)
  return cleaned.length > 0 ? cleaned : undefined
}

/** A url button, or null when there is no valid https url (Telegram rejects http). */
export function urlButton(text: string, url: string | null): TelegramInlineButton | null {
  if (!url) return null
  return { text, url }
}

/** A callback button (handled by the webhook). */
export function callbackButton(text: string, data: string): TelegramInlineButton {
  return { text, callback_data: data }
}
