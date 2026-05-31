import { describe, expect, it } from 'vitest'
import { mergeDiscoveryFeeds } from '@/domains/marketplace/discovery/application/mappers/publication-to-discovery.mapper'
import {
  DISCOVERY_MIGRATION_PHASE,
  DISCOVERY_SOURCE_CANONICAL,
  DISCOVERY_SOURCE_SUNSET,
  getDiscoverySource,
} from '@/domains/marketplace/discovery/config/discovery-source'
import {
  isAllowedRelation,
  relationTypeFromLegacyComposition,
} from '@/domains/marketplace/shared/domain/relation-type-registry'
import { structuralRoleFromLegacyKind } from '@/domains/marketplace/shared/domain/structural-role'
import {
  canEditPublication,
  isStoreOwner,
} from '@/domains/marketplace/shared/application/ownership-policy'

describe('discovery-source', () => {
  it('defaults to publication canonical source (Fase C)', () => {
    expect(getDiscoverySource()).toBe('publication')
    expect(getDiscoverySource()).toBe(DISCOVERY_SOURCE_CANONICAL)
    expect(DISCOVERY_MIGRATION_PHASE.C).toBe('publication')
  })

  it('defines valid sunset dates for legacy phases', () => {
    const phaseBSunset = new Date(`${DISCOVERY_SOURCE_SUNSET[DISCOVERY_MIGRATION_PHASE.B]}T00:00:00Z`)
    expect(Number.isNaN(phaseBSunset.getTime())).toBe(false)
    expect(phaseBSunset.getTime()).toBeGreaterThan(Date.now())
  })
})

describe('discovery merge', () => {
  it('prefers primary feed on duplicate ids', () => {
    const merged = mergeDiscoveryFeeds(
      [{ id: '1', listingType: 'product', title: 'From Pub', price: 10, image: null, storeId: 's', storeName: 'S', categoryId: 'c', latitude: null, longitude: null }],
      [{ id: '1', listingType: 'product', title: 'From Listing', price: 5, image: null, storeId: 's', storeName: 'S', categoryId: 'c', latitude: null, longitude: null }],
    )
    expect(merged).toHaveLength(1)
    expect(merged[0]?.title).toBe('From Pub')
  })
})

describe('structural-role', () => {
  it('maps legacy variant kind to child', () => {
    expect(structuralRoleFromLegacyKind('variant')).toBe('child')
  })

  it('maps base to root', () => {
    expect(structuralRoleFromLegacyKind('base')).toBe('root')
  })
})

describe('relation-type-registry', () => {
  it('allows recipe uses product', () => {
    expect(isAllowedRelation('uses', 'recipe', 'product')).toBe(true)
  })

  it('maps legacy composition types', () => {
    expect(relationTypeFromLegacyComposition('base_recipe')).toBe('uses')
    expect(relationTypeFromLegacyComposition('base_variant')).toBe('commercial_variant_of')
  })
})

describe('ownership-policy', () => {
  it('allows store operator to edit own publication', () => {
    const pub = {
      owner: { ownerType: 'store' as const, ownerId: 'user-1' },
    }
    expect(isStoreOwner({ userId: 'user-1' }, pub.owner)).toBe(true)
    expect(canEditPublication({ userId: 'user-1' }, pub as never)).toBe(true)
  })
})
