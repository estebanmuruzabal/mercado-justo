import { describe, expect, it } from 'vitest'

import {
  aggregateCarbonScore,
  estimateCarbonScore,
  getCarbonLevel,
  getCarbonPresentation,
} from '@/domains/logistics/domain/engines/sustainability-engine'

describe('getCarbonLevel', () => {
  it('maps distance ranges to levels', () => {
    expect(getCarbonLevel(1)).toBe('very_low')
    expect(getCarbonLevel(2)).toBe('very_low')
    expect(getCarbonLevel(3)).toBe('low')
    expect(getCarbonLevel(7)).toBe('medium')
    expect(getCarbonLevel(20)).toBe('high')
  })

  it('falls back to low for unknown distances', () => {
    expect(getCarbonLevel(null)).toBe('low')
    expect(getCarbonLevel(undefined)).toBe('low')
    expect(getCarbonLevel(-5)).toBe('low')
  })
})

describe('getCarbonPresentation', () => {
  it('returns a label and icon per level', () => {
    expect(getCarbonPresentation('very_low').label).toBe('Muy bajo')
    expect(getCarbonPresentation('high').icon).toBe('Truck')
  })
})

describe('carbon scoring', () => {
  it('weights pickup lower than delivery', () => {
    expect(estimateCarbonScore(10, 'pickup')).toBeLessThan(
      estimateCarbonScore(10, 'mj_delivery'),
    )
  })

  it('returns 0 for unknown distance', () => {
    expect(estimateCarbonScore(null)).toBe(0)
  })

  it('aggregates shipment scores', () => {
    const total = aggregateCarbonScore([
      { distanceKm: 10, deliveryMethod: 'mj_delivery' },
      { distanceKm: 5, deliveryMethod: 'pickup' },
      { distanceKm: null, deliveryMethod: 'own_delivery' },
    ])
    expect(total).toBe(11)
  })
})
