/**
 * WhatsApp helpers. Numbers are stored as digits only (country code + number,
 * no "+", spaces or dashes) so they can be dropped straight into wa.me links.
 */

/** Keep only digits, dropping a leading "+", spaces, parentheses, etc. */
export function normalizeWhatsappNumber(value: string): string {
  return value.replace(/\D/g, '')
}

export const WHATSAPP_MIN_DIGITS = 8
export const WHATSAPP_MAX_DIGITS = 15

export function isValidWhatsappNumber(value: string): boolean {
  const digits = normalizeWhatsappNumber(value)
  return digits.length >= WHATSAPP_MIN_DIGITS && digits.length <= WHATSAPP_MAX_DIGITS
}

/** Build a https://wa.me/<number> link, optionally with a prefilled message. */
export function whatsappLink(number: string, message?: string): string {
  const digits = normalizeWhatsappNumber(number)
  const base = `https://wa.me/${digits}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}
