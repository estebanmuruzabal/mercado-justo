import { describe, expect, it } from 'vitest'
import { deriveGrowerHealth } from '@/domains/dittobots/domain/grower-network-policy'
import type { GrowerHealthSignals } from '@/domains/dittobots/domain/grower-network.types'

const healthySignals: GrowerHealthSignals = {
  offlineDittoBotCount: 0,
  sensorsNotReportingCount: 0,
  repeatedErrorCount: 0,
  failingProtocolCount: 0,
  outOfRangeParameterCount: 0,
}

describe('deriveGrowerHealth', () => {
  it('returns healthy when all signals are zero', () => {
    expect(deriveGrowerHealth(healthySignals)).toBe('healthy')
  })

  it('returns attention_required for sensor or error signals', () => {
    expect(
      deriveGrowerHealth({
        ...healthySignals,
        sensorsNotReportingCount: 1,
      }),
    ).toBe('attention_required')

    expect(
      deriveGrowerHealth({
        ...healthySignals,
        repeatedErrorCount: 3,
      }),
    ).toBe('attention_required')
  })

  it('returns assistance_required when critical signals present', () => {
    expect(
      deriveGrowerHealth({
        ...healthySignals,
        offlineDittoBotCount: 1,
      }),
    ).toBe('assistance_required')

    expect(
      deriveGrowerHealth({
        ...healthySignals,
        failingProtocolCount: 2,
      }),
    ).toBe('assistance_required')
  })

  it('prioritizes assistance over attention', () => {
    expect(
      deriveGrowerHealth({
        offlineDittoBotCount: 1,
        sensorsNotReportingCount: 5,
        repeatedErrorCount: 5,
        failingProtocolCount: 0,
        outOfRangeParameterCount: 0,
      }),
    ).toBe('assistance_required')
  })
})
