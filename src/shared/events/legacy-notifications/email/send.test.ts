import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactElement } from 'react'

const sendMock = vi.fn()
const isEmailConfiguredMock = vi.fn()
const getEnvironmentBadgeMock = vi.fn()

vi.mock('./client', () => ({
  getResendClient: () => ({
    emails: { send: sendMock },
  }),
}))

vi.mock('./config', () => ({
  isEmailConfigured: () => isEmailConfiguredMock(),
  getFromEmail: () => 'onboarding@resend.dev',
  getReplyToEmail: () => undefined,
}))

vi.mock('@/shared/config/environment', () => ({
  getEnvironmentBadge: () => getEnvironmentBadgeMock(),
}))

import { sendEmail } from './send'

const dummyReact = { type: 'div', props: {} } as unknown as ReactElement

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isEmailConfiguredMock.mockReturnValue(true)
    getEnvironmentBadgeMock.mockReturnValue('🛠️ [DEV] ')
  })

  it('returns not_configured when email is disabled', async () => {
    isEmailConfiguredMock.mockReturnValue(false)

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Hello',
      react: dummyReact,
    })

    expect(result).toEqual({ delivered: false, reason: 'not_configured' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('prefixes subject with environment badge', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null })

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Pedido confirmado',
      react: dummyReact,
    })

    expect(result.delivered).toBe(true)
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ subject: '🛠️ [DEV] Pedido confirmado' }),
    )
  })

  it('never throws on Resend API error', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'rate limited' } })

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Fail',
      react: dummyReact,
    })

    expect(result).toEqual({ delivered: false, reason: 'rate limited' })
  })

  it('never throws on network failure', async () => {
    sendMock.mockRejectedValue(new Error('network down'))

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Fail',
      react: dummyReact,
    })

    expect(result.delivered).toBe(false)
    expect(result.reason).toBe('network down')
  })
})
