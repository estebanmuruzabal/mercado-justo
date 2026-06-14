import { describe, expect, it } from 'vitest'

import type { DittoCommunityMapQuery } from '@/domains/dittobots/domain/device-map.hooks'

describe('device-map.hooks', () => {
  it('defines community map layer union', () => {
    const layers: DittoCommunityMapQuery['layers'] = [
      'dittobots',
      'ditto_clima',
      'productions',
      'public_protocols',
      'growers',
    ]
    const query: DittoCommunityMapQuery = {
      layers,
      publicDevicesOnly: true,
      region: 'Patagonia',
    }

    expect(query.publicDevicesOnly).toBe(true)
    expect(query.layers).toHaveLength(5)
  })
})
