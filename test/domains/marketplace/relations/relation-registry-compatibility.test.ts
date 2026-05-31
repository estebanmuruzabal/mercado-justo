import { describe, expect, it } from 'vitest'
import {
  isAllowedRelation,
  relationTypeFromLegacyComposition,
} from '@/domains/marketplace/relations/domain/registry/relation-type-registry'

describe('relation-type-registry', () => {
  it('allows recipe uses product', () => {
    expect(isAllowedRelation('uses', 'recipe', 'product')).toBe(true)
  })

  it('maps legacy composition types', () => {
    expect(relationTypeFromLegacyComposition('base_recipe')).toBe('uses')
    expect(relationTypeFromLegacyComposition('base_variant')).toBe('commercial_variant_of')
  })
})
