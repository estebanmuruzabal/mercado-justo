import { describe, expect, it } from 'vitest'

import {
  canViewDeviceLocation,
  filterPublicMapDevices,
  resolveInitialDeviceLocation,
} from '@/domains/dittobots/domain/device-location.policy'
import type { DittoBotInventoryUnit } from '@/domains/dittobots/domain/ditto-bot-inventory-unit'

function unit(overrides: Partial<DittoBotInventoryUnit> = {}): DittoBotInventoryUnit {
  return {
    id: 'd1',
    serialNumber: 'SN-1',
    activationCode: 'CODE',
    model: 'Grow',
    subtype: null,
    status: 'activated',
    ownerUserId: 'owner-1',
    activatedAt: '2026-01-01T00:00:00Z',
    location: { lat: -34.6, lng: -58.4, region: 'Granja' },
    inheritsUserLocation: false,
    isPublicOnMap: false,
    friendlyName: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('device-location.policy', () => {
  it('snapshots user location when inherits=true', () => {
    expect(
      resolveInitialDeviceLocation(true, { lat: 1, lng: 2, region: 'Casa' }),
    ).toEqual({ lat: 1, lng: 2, region: 'Casa' })
  })

  it('returns empty location when inherits=false', () => {
    expect(resolveInitialDeviceLocation(false, { lat: 1, lng: 2, region: 'Casa' })).toEqual({
      lat: null,
      lng: null,
      region: null,
    })
  })

  it('filterPublicMapDevices requires public + activated + coordinates', () => {
    const publicUnit = unit({ isPublicOnMap: true })
    const privateUnit = unit({ id: 'd2', isPublicOnMap: false })
    const noCoords = unit({ id: 'd3', isPublicOnMap: true, location: { lat: null, lng: null, region: 'X' } })

    expect(filterPublicMapDevices([publicUnit, privateUnit, noCoords])).toEqual([publicUnit])
  })

  it('device location ownership — owner and super-admin can view', () => {
    const device = unit()
    expect(canViewDeviceLocation({ userId: 'owner-1', isSuperAdmin: false }, device)).toBe(true)
    expect(canViewDeviceLocation({ userId: 'stranger', isSuperAdmin: true }, device)).toBe(true)
    expect(canViewDeviceLocation({ userId: 'stranger', isSuperAdmin: false }, device)).toBe(false)
  })

  it('public map devices visible to strangers when flagged', () => {
    const device = unit({ isPublicOnMap: true })
    expect(canViewDeviceLocation({ userId: 'stranger', isSuperAdmin: false }, device)).toBe(true)
  })
})
