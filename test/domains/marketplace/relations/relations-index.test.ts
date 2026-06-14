import { describe, expect, it } from 'vitest'

describe('relations public API surface (C5)', () => {
  it('exports only resolveRelationSnapshots at runtime', async () => {
    const relationsModule = await import('@/domains/marketplace/relations')
    expect(Object.keys(relationsModule).sort()).toEqual(['resolveRelationSnapshots'])
  })

  it('resolveRelationSnapshots is a function', async () => {
    const mod = await import('@/domains/marketplace/relations')
    expect(typeof mod.resolveRelationSnapshots).toBe('function')
  })
})
