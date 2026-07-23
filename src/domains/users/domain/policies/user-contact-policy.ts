import { isValidWhatsappNumber, normalizeWhatsappNumber } from '@/domains/vendors/domain/whatsapp'

export function normalizeTelegramUsername(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  return value.trim().replace(/^@+/, '')
}

export function normalizePhoneNumber(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const digits = value.replace(/\D/g, '')
  return digits.length > 0 ? digits : null
}

export function normalizeWhatsappContact(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const digits = normalizeWhatsappNumber(value)
  return digits.length > 0 ? digits : null
}

export function validatePhoneNumber(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const digits = normalizePhoneNumber(value)
  if (!digits || digits.length < 8 || digits.length > 15) {
    return 'Ingresá un teléfono válido (8 a 15 dígitos).'
  }
  return null
}

export function validateWhatsappNumber(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  if (!isValidWhatsappNumber(value)) {
    return 'Ingresá un número de WhatsApp válido (8 a 15 dígitos).'
  }
  return null
}

export function validateTelegramUsername(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const username = normalizeTelegramUsername(value)
  if (!username || !/^[A-Za-z0-9_]{5,32}$/.test(username)) {
    return 'El usuario de Telegram debe tener entre 5 y 32 caracteres (letras, números o _).'
  }
  return null
}

export type ContactChannel = 'phone' | 'whatsapp' | 'telegram' | 'email'

export function listEnabledContactChannels(input: {
  phoneNumber: string | null
  whatsappNumber: string | null
  telegramUsername: string | null
  telegramConnected: boolean
  telegramChatId?: string | null
  email: string | null
  allowPhoneCalls: boolean
  allowWhatsappMessages: boolean
  allowTelegramMessages: boolean
  allowEmailContact: boolean
}): ContactChannel[] {
  const channels: ContactChannel[] = []

  if (input.allowPhoneCalls && input.phoneNumber) channels.push('phone')
  if (input.allowWhatsappMessages && input.whatsappNumber) channels.push('whatsapp')
  if (
    input.allowTelegramMessages &&
    (input.telegramConnected || Boolean(input.telegramUsername) || input.telegramChatId)
  ) {
    channels.push('telegram')
  }
  if (input.allowEmailContact && input.email?.trim()) channels.push('email')

  return channels
}
