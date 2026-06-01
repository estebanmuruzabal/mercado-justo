import { describe, expect, it } from 'vitest'

import {
  assertActivatableUnit,
  buildActivationPatch,
  DittoBotActivationError,
} from '@/domains/dittobots/domain/activate-ditto-bot.policy'

describe('activate-ditto-bot.policy', () => {
  const candidate = {
    serialNumber: 'SN-001',
    activationCode: 'CODE-ABC',
    status: 'available' as const,
    ownerUserId: null,
  }

  it('copies user location on activate when inherits=true', () => {
    const patch = buildActivationPatch(
      'user-1',
      { lat: -34.6, lng: -58.4, region: 'Granja' },
      true,
    )

    expect(patch.ownerUserId).toBe('user-1')
    expect(patch.status).toBe('activated')
    expect(patch.location).toEqual({ lat: -34.6, lng: -58.4, region: 'Granja' })
  })

  it('leaves location null when user has no location', () => {
    const patch = buildActivationPatch('user-1', null, true)
    expect(patch.location).toEqual({ lat: null, lng: null, region: null })
  })

  it('rejects invalid activation code', () => {
    expect(() =>
      assertActivatableUnit(candidate, {
        serialNumber: 'SN-001',
        activationCode: 'WRONG',
      }),
    ).toThrow(DittoBotActivationError)
  })

  it('rejects already activated units', () => {
    expect(() =>
      assertActivatableUnit(
        { ...candidate, status: 'activated', ownerUserId: 'other' },
        { serialNumber: 'SN-001', activationCode: 'CODE-ABC' },
      ),
    ).toThrow(/ya fue activado/)
  })
})
