import { describe, expect, it } from 'vitest'
import {
  assertNotSelfRelation,
  compareRelationsDeterministic,
  resolveRelationStatus,
  resolveRelationVisibility,
} from '@/domains/marketplace/relations/domain/policies/relation-policy'
import type { PublicationRelation } from '@/domains/marketplace/relations/domain/entities/publication-relation'

const pub = (visibility: string, lifecycleState = 'published') => ({
  visibility,
  lifecycleState,
})

const relation = (overrides: Partial<PublicationRelation> = {}): PublicationRelation => ({
  id: 'rel-1',
  sourcePublicationId: 'pub-source',
  targetPublicationId: 'pub-target',
  relationType: 'uses',
  metadata: {},
  visibility: 'inherit',
  validFrom: null,
  validTo: null,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  isActive: true,
  ...overrides,
})

describe('resolveRelationStatus (C2)', () => {
  const now = new Date('2026-06-01T12:00:00Z')

  it('returns inactive when isActive is false', () => {
    expect(resolveRelationStatus(relation({ isActive: false }), now)).toBe('inactive')
  })

  it('returns scheduled when validFrom is in the future', () => {
    expect(
      resolveRelationStatus(relation({ validFrom: '2026-12-01T00:00:00Z' }), now),
    ).toBe('scheduled')
  })

  it('returns expired when validTo is in the past', () => {
    expect(resolveRelationStatus(relation({ validTo: '2026-01-01T00:00:00Z' }), now)).toBe(
      'expired',
    )
  })

  it('returns active otherwise', () => {
    expect(resolveRelationStatus(relation(), now)).toBe('active')
  })
})

describe('resolveRelationVisibility (B4 / ADR-R3-007)', () => {
  it('public edge is visible when both publications are public published', () => {
    expect(
      resolveRelationVisibility(relation({ visibility: 'public' }), pub('public'), pub('public')),
    ).toBe('visible')
  })

  it('public edge is hidden when either publication is draft', () => {
    expect(
      resolveRelationVisibility(
        relation({ visibility: 'public' }),
        pub('public', 'draft'),
        pub('public'),
      ),
    ).toBe('hidden')
  })

  it('private edge is hidden', () => {
    expect(
      resolveRelationVisibility(relation({ visibility: 'private' }), pub('public'), pub('public')),
    ).toBe('hidden')
  })

  it('inherit + public/public published is visible', () => {
    expect(resolveRelationVisibility(relation({ visibility: 'inherit' }), pub('public'), pub('public'))).toBe(
      'visible',
    )
  })

  it('inherit + public/public draft is hidden', () => {
    expect(
      resolveRelationVisibility(
        relation({ visibility: 'inherit' }),
        pub('public', 'draft'),
        pub('public'),
      ),
    ).toBe('hidden')
  })

  it('inherit + public/private is hidden', () => {
    expect(
      resolveRelationVisibility(relation({ visibility: 'inherit' }), pub('public'), pub('private')),
    ).toBe('hidden')
  })

  it('inherit + private/public is hidden', () => {
    expect(
      resolveRelationVisibility(relation({ visibility: 'inherit' }), pub('private'), pub('public')),
    ).toBe('hidden')
  })

  it('inherit + private/private is hidden', () => {
    expect(
      resolveRelationVisibility(relation({ visibility: 'inherit' }), pub('private'), pub('private')),
    ).toBe('hidden')
  })
})

describe('compareRelationsDeterministic (C3)', () => {
  it('orders by sort_order, created_at, id', () => {
    const rows = [
      relation({ id: 'c', createdAt: '2026-01-03T00:00:00Z', metadata: { sort_order: 2 } }),
      relation({ id: 'a', createdAt: '2026-01-01T00:00:00Z', metadata: { sort_order: 1 } }),
      relation({ id: 'b', createdAt: '2026-01-02T00:00:00Z', metadata: { sort_order: 1 } }),
    ]
    const sorted = [...rows].sort(compareRelationsDeterministic)
    expect(sorted.map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('assertNotSelfRelation', () => {
  it('throws on self relation', () => {
    expect(() => assertNotSelfRelation('same', 'same')).toThrow('Self-relations')
  })
})
