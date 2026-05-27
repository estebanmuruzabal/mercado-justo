import { describe, expect, it } from 'vitest'

import { addDistanceToListings, formatDistanceLabel } from '@/lib/location/add-distance-to-listings'

describe('formatDistanceLabel', () => {
  it('formats sub-kilometer distances in meters', () => {
    expect(formatDistanceLabel(0.45)).toBe('450 m de vos')
    expect(formatDistanceLabel(0.999)).toBe('999 m de vos')
  })

  it('formats kilometer distances with one decimal', () => {
    expect(formatDistanceLabel(1)).toBe('1.0 km de vos')
    expect(formatDistanceLabel(2.34)).toBe('2.3 km de vos')
  })
})

describe('addDistanceToListings', () => {
  const listings = [
    { id: '1', latitude: -27.47, longitude: -58.9868 },
    { id: '2', latitude: null, longitude: null },
  ]

  it('returns null distance when user location is missing', () => {
    const result = addDistanceToListings(listings, null)
    expect(result[0].distanceKm).toBeNull()
    expect(result[0].distanceLabel).toBeNull()
    expect(result[1].distanceKm).toBeNull()
  })

  it('enriches listings with distance when coords are valid', () => {
    const user = { latitude: -27.47, longitude: -58.9868 }
    const result = addDistanceToListings(listings, user)
    expect(result[0].distanceKm).toBe(0)
    expect(result[0].distanceLabel).toBe('0 m de vos')
    expect(result[1].distanceKm).toBeNull()
    expect(result[1].distanceLabel).toBeNull()
  })
})
