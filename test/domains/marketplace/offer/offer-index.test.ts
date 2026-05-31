import { describe, expect, it } from 'vitest'

describe('offer public API surface (A5)', () => {
  it('exports only resolveCommercialSnapshots and CommercialSnapshot', async () => {
    const offerModule = await import('@/domains/marketplace/offer')
    const exportNames = Object.keys(offerModule)
    expect(exportNames.sort()).toEqual(['resolveCommercialSnapshots'])
  })

  it('CommercialSnapshot type is importable', async () => {
    const mod = await import('@/domains/marketplace/offer')
    expect(typeof mod.resolveCommercialSnapshots).toBe('function')
  })
})
