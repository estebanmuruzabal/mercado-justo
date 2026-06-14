import { describe, expect, it } from 'vitest'
import { assertRelationRegistryIntegrity } from '@/domains/marketplace/relations/domain/registry/relation-registry-integrity'
import { getRelationTypeDefinition } from '@/domains/marketplace/relations/domain/registry/relation-type-registry'

describe('assertRelationRegistryIntegrity (C4)', () => {
  it('passes for canonical registry', () => {
    expect(() => assertRelationRegistryIntegrity()).not.toThrow()
  })

  it('marks commercial_variant_of as deprecated (M5)', () => {
    expect(getRelationTypeDefinition('commercial_variant_of')?.deprecated).toBe(true)
  })
})
