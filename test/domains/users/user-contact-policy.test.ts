import { describe, expect, it } from 'vitest'

import { listEnabledContactChannels } from '@/domains/users/domain/policies/user-contact-policy'

describe('listEnabledContactChannels', () => {
  it('returns only channels the user opted into with data present', () => {
    expect(
      listEnabledContactChannels({
        phoneNumber: '5491112345678',
        whatsappNumber: null,
        telegramUsername: 'grower1',
        telegramConnected: false,
        email: 'user@example.com',
        allowPhoneCalls: true,
        allowWhatsappMessages: false,
        allowTelegramMessages: true,
        allowEmailContact: true,
      }),
    ).toEqual(['phone', 'telegram', 'email'])
  })

  it('requires telegram connection or username when telegram is enabled', () => {
    expect(
      listEnabledContactChannels({
        phoneNumber: null,
        whatsappNumber: null,
        telegramUsername: null,
        telegramConnected: false,
        email: 'user@example.com',
        allowPhoneCalls: false,
        allowWhatsappMessages: false,
        allowTelegramMessages: true,
        allowEmailContact: false,
      }),
    ).toEqual([])
  })
})
