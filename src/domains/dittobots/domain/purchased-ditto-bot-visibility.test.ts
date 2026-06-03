import { describe, expect, it } from 'vitest'

import { canViewFullActivationCode, maskActivationCode } from './purchased-ditto-bot-visibility'

describe('purchased DittoBot visibility', () => {
  it('allows buyers and super admins to view full activation codes', () => {
    expect(canViewFullActivationCode('buyer')).toBe(true)
    expect(canViewFullActivationCode('super-admin')).toBe(true)
    expect(canViewFullActivationCode('vendor')).toBe(false)
  })

  it('masks vendor activation codes without losing serial visibility', () => {
    expect(maskActivationCode('ABCD-EFGH-IJKL')).toBe('ABCD-****-****')
  })
})
