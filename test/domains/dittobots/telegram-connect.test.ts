import { describe, expect, it } from 'vitest'

import {
  TELEGRAM_LINK_TOKEN_TTL_MS,
  TELEGRAM_START_PAYLOAD_PREFIX,
} from '@/shared/telegram/telegram/constants'
import { buildStartPayload, linkTokenExpiry, parseStartPayload } from '@/shared/telegram/telegram/link-payload'
import { defaultUserTelegramSettings } from '@/domains/dittobots/domain/vendor-telegram-settings'

describe('telegram connect payload', () => {
  it('uses connect_ prefix', () => {
    expect(TELEGRAM_START_PAYLOAD_PREFIX).toBe('connect_')
    expect(buildStartPayload('abcd1234efgh5678')).toBe('connect_abcd1234efgh5678')
  })

  it('parses valid connect tokens', () => {
    expect(parseStartPayload('connect_abcd1234efgh5678')).toBe('abcd1234efgh5678')
    expect(parseStartPayload('connect_')).toBeNull()
    expect(parseStartPayload('vendor_abcd')).toBeNull()
    expect(parseStartPayload(null)).toBeNull()
  })

  it('mints tokens with 15 minute TTL', () => {
    expect(TELEGRAM_LINK_TOKEN_TTL_MS).toBe(15 * 60 * 1000)
    const now = new Date('2026-07-28T12:00:00.000Z')
    expect(linkTokenExpiry(now)).toBe('2026-07-28T12:15:00.000Z')
  })
})

describe('defaultUserTelegramSettings', () => {
  it('returns disconnected defaults keyed by user id', () => {
    const settings = defaultUserTelegramSettings('user-1')
    expect(settings.userId).toBe('user-1')
    expect(settings.storeId).toBe('user-1')
    expect(settings.connected).toBe(false)
    expect(settings.status).toBe('expired')
    expect(settings.chatId).toBeNull()
  })
})
