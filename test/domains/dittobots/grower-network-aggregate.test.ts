import { describe, expect, it } from 'vitest'

import { aggregateGrowerNetworkFromDevices } from '@/domains/dittobots/domain/grower-network-policy'
import type { PublicDittoDeviceMapPin } from '@/domains/dittobots/domain/grower-network.types'

describe('aggregateGrowerNetworkFromDevices', () => {
  const pin = (
    overrides: Partial<PublicDittoDeviceMapPin> = {},
  ): PublicDittoDeviceMapPin => ({
    deviceId: 'd1',
    ownerUserId: 'grower-1',
    model: 'Grow',
    subtype: null,
    friendlyName: 'Granja',
    location: { lat: -34.6, lng: -58.4, region: 'Granja' },
    status: 'activated',
    isPublicOnMap: true,
    ...overrides,
  })

  it('aggregates device counts per grower user', () => {
    const summaries = aggregateGrowerNetworkFromDevices([
      pin({ deviceId: 'd1' }),
      pin({ deviceId: 'd2', ownerUserId: 'grower-1', activeProtocolId: 'p1' }),
      pin({ deviceId: 'd3', ownerUserId: 'grower-2' }),
    ])

    expect(summaries).toHaveLength(2)
    const grower1 = summaries.find((s) => s.userId === 'grower-1')
    expect(grower1?.deviceCount).toBe(2)
    expect(grower1?.publicDeviceCount).toBe(2)
    expect(grower1?.activeProtocolCount).toBe(1)
    expect(grower1?.approximateLocation?.region).toBe('Granja')
  })
})
