import { describe, expect, it } from 'vitest'

import {
  type BatchCandidate,
  estimateEtaMinutes,
  groupByProximity,
  isBatchEligible,
  tripsSaved,
} from '@/lib/admin/engines/logistics-engine'

const base = (over: Partial<BatchCandidate>): BatchCandidate => ({
  shipmentId: 's1',
  storeId: 'store1',
  status: 'in_transit',
  origin: { latitude: -27.45, longitude: -58.98 },
  destination: { latitude: -27.45, longitude: -58.98 },
  ...over,
})

describe('isBatchEligible', () => {
  it('requires active status and geo', () => {
    expect(isBatchEligible(base({}))).toBe(true)
    expect(isBatchEligible(base({ status: 'pending' }))).toBe(false)
    expect(isBatchEligible(base({ destination: null }))).toBe(false)
  })
})

describe('groupByProximity', () => {
  it('clusters nearby destinations and separates far ones', () => {
    const candidates: BatchCandidate[] = [
      base({ shipmentId: 'a', destination: { latitude: -27.45, longitude: -58.98 } }),
      base({ shipmentId: 'b', destination: { latitude: -27.451, longitude: -58.981 } }),
      base({ shipmentId: 'c', destination: { latitude: -27.9, longitude: -59.5 } }),
    ]
    const groups = groupByProximity(candidates, 3)
    expect(groups).toHaveLength(2)
    const sizes = groups.map((g) => g.length).sort()
    expect(sizes).toEqual([1, 2])
  })

  it('ignores ineligible candidates', () => {
    const groups = groupByProximity([base({ status: 'pending' })])
    expect(groups).toHaveLength(0)
  })
})

describe('estimateEtaMinutes', () => {
  it('returns null for unknown distance', () => {
    expect(estimateEtaMinutes(null)).toBeNull()
  })

  it('grows with distance', () => {
    const near = estimateEtaMinutes(1)!
    const far = estimateEtaMinutes(10)!
    expect(far).toBeGreaterThan(near)
  })
})

describe('tripsSaved', () => {
  it('counts shipments minus batches', () => {
    const g = (n: number) => Array.from({ length: n }, (_, i) => base({ shipmentId: `x${i}` }))
    expect(tripsSaved([g(3), g(2)])).toBe(3)
    expect(tripsSaved([g(1)])).toBe(0)
  })
})
