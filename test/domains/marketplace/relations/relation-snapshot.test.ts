import { describe, expect, it } from 'vitest'
import { mapRelationReadRowToSnapshot } from '@/domains/marketplace/relations/application/mappers/relation-snapshot.mapper'
import type { RelationReadRow } from '@/domains/marketplace/relations/infrastructure/relation.repository'

const baseRow = (): RelationReadRow => ({
  relation: {
    id: 'rel-1',
    sourcePublicationId: 'pub-recipe',
    targetPublicationId: 'pub-product',
    relationType: 'uses',
    metadata: { sort_order: 1, image: 'ignored' },
    visibility: 'inherit',
    validFrom: null,
    validTo: null,
    createdBy: null,
    createdAt: '2026-01-01T00:00:00Z',
    isActive: true,
  },
  sourcePublication: {
    id: 'pub-recipe',
    title: 'Recipe',
    publicationType: 'recipe',
    visibility: 'public',
    lifecycleState: 'published',
    ownerType: 'store',
    ownerId: 'user-1',
    attributes: {},
  },
  targetPublication: {
    id: 'pub-product',
    title: 'Aceite',
    publicationType: 'product',
    visibility: 'public',
    lifecycleState: 'published',
    ownerType: 'store',
    ownerId: 'user-2',
    attributes: { image: 'https://example.com/aceite.jpg' },
  },
  anchorPublicationId: 'pub-recipe',
  direction: 'outgoing',
})

describe('mapRelationReadRowToSnapshot (B1 + C1)', () => {
  it('includes version 1 and enriched relatedPublication', () => {
    const snapshot = mapRelationReadRowToSnapshot(baseRow())
    expect(snapshot.version).toBe(1)
    expect(snapshot.relatedPublication).toEqual({
      id: 'pub-product',
      title: 'Aceite',
      publicationType: 'product',
      coverImage: 'https://example.com/aceite.jpg',
    })
    expect(snapshot.sortOrder).toBe(1)
  })

  it('maps incoming direction to source publication summary', () => {
    const snapshot = mapRelationReadRowToSnapshot({
      ...baseRow(),
      direction: 'incoming',
      anchorPublicationId: 'pub-product',
    })
    expect(snapshot.relatedPublication.id).toBe('pub-recipe')
    expect(snapshot.relatedPublication.title).toBe('Recipe')
  })
})
