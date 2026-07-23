import { describe, expect, it, vi } from 'vitest'

import {
  userTelegramConnectErrorMessage,
  userTelegramConnectSuccessMessage,
} from '@/domains/users/domain/user-telegram-connection'
import {
  buildUserStartPayload,
  isValidUserConnectDeepLink,
  parseUserStartPayload,
  USER_TELEGRAM_START_PAYLOAD_PREFIX,
} from '@/shared/telegram/telegram/user-link-payload'
import { buildUserConnectDeepLink } from '@/shared/telegram/telegram/user-link'

vi.mock('@/shared/telegram/telegram/config', () => ({
  getTelegramBotUsername: () => 'MercadoJustoBot',
}))

describe('userTelegramConnect messages', () => {
  it('maps webhook results to user-facing copy', () => {
    expect(userTelegramConnectSuccessMessage({ status: 'connected', userId: 'u1' })).toContain(
      'vinculada correctamente',
    )
    expect(userTelegramConnectErrorMessage({ status: 'expired_token' })).toContain('expiró')
    expect(userTelegramConnectErrorMessage({ status: 'invalid_token' })).toContain('utilizado')
    expect(userTelegramConnectErrorMessage({ status: 'chat_taken' })).toContain('otro usuario')
  })
})

describe('user telegram start payload format', () => {
  it('uses connect_ prefix for user deep links', () => {
    expect(USER_TELEGRAM_START_PAYLOAD_PREFIX).toBe('connect_')
    expect(buildUserStartPayload('abcd1234efgh5678')).toBe('connect_abcd1234efgh5678')
    expect(parseUserStartPayload('connect_abcd1234efgh5678')).toBe('abcd1234efgh5678')
    expect(parseUserStartPayload('vendor_storetoken')).toBeNull()
    expect(parseUserStartPayload('')).toBeNull()
  })

  it('builds and validates deep links with embedded token', () => {
    const token = 'a'.repeat(48)
    const deepLink = buildUserConnectDeepLink(token)

    expect(deepLink).toBe(
      `https://t.me/MercadoJustoBot?start=${encodeURIComponent(`connect_${token}`)}`,
    )
    expect(isValidUserConnectDeepLink(deepLink)).toBe(true)
    expect(isValidUserConnectDeepLink('https://t.me/MercadoJustoBot?start')).toBe(false)
    expect(isValidUserConnectDeepLink('https://t.me/MercadoJustoBot')).toBe(false)
  })
})
