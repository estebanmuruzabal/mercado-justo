import { describe, expect, it } from 'vitest'

import {
  allowedTransitions,
  assertTransition,
  canTransition,
  deriveOrderLogisticStatus,
  isActiveDelivery,
  isStuck,
  isTerminalStatus,
} from '@/domains/logistics/domain/engines/fulfillment-engine'

describe('fulfillment-engine transitions', () => {
  it('allows valid forward transitions', () => {
    expect(canTransition('pending', 'preparing')).toBe(true)
    expect(canTransition('preparing', 'in_transit')).toBe(true)
    expect(canTransition('in_transit', 'delivered')).toBe(true)
  })

  it('rejects invalid or no-op transitions', () => {
    expect(canTransition('pending', 'delivered')).toBe(false)
    expect(canTransition('delivered', 'pending')).toBe(false)
    expect(canTransition('pending', 'pending')).toBe(false)
  })

  it('treats delivered/cancelled as terminal', () => {
    expect(isTerminalStatus('delivered')).toBe(true)
    expect(isTerminalStatus('cancelled')).toBe(true)
    expect(allowedTransitions('delivered')).toHaveLength(0)
  })

  it('flags active delivery stages', () => {
    expect(isActiveDelivery('in_transit')).toBe(true)
    expect(isActiveDelivery('pending')).toBe(false)
    expect(isActiveDelivery('delivered')).toBe(false)
  })

  it('assertTransition throws on invalid', () => {
    expect(() => assertTransition('pending', 'delivered')).toThrow()
    expect(assertTransition('pending', 'preparing')).toBe('preparing')
  })
})

describe('deriveOrderLogisticStatus', () => {
  it('returns pending for empty input', () => {
    expect(deriveOrderLogisticStatus([])).toBe('pending')
  })

  it('incident dominates', () => {
    expect(deriveOrderLogisticStatus(['delivered', 'incident'])).toBe('incident')
  })

  it('all delivered -> delivered', () => {
    expect(deriveOrderLogisticStatus(['delivered', 'delivered'])).toBe('delivered')
  })

  it('all cancelled -> cancelled', () => {
    expect(deriveOrderLogisticStatus(['cancelled', 'cancelled'])).toBe('cancelled')
  })

  it('returns least-advanced in-progress stage', () => {
    expect(deriveOrderLogisticStatus(['in_transit', 'preparing'])).toBe('preparing')
    expect(deriveOrderLogisticStatus(['delivered', 'in_transit'])).toBe('in_transit')
  })
})

describe('isStuck', () => {
  const now = new Date('2026-05-29T12:00:00Z')

  it('is false for terminal statuses', () => {
    expect(isStuck('delivered', '2026-05-01T00:00:00Z', now)).toBe(false)
  })

  it('is true when over the threshold', () => {
    expect(isStuck('preparing', '2026-05-26T00:00:00Z', now, 48)).toBe(true)
  })

  it('is false when within the threshold', () => {
    expect(isStuck('preparing', '2026-05-29T06:00:00Z', now, 48)).toBe(false)
  })
})
