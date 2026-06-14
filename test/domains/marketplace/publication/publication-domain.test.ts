import { describe, expect, it } from 'vitest'
import {
  getPublicationTypeDefinition,
  isPersistablePublicationType,
  PUBLICATION_TYPE_REGISTRY,
  type PublicationTypeCode,
} from '@/domains/marketplace/shared/domain/publication-type-registry'
import {
  canTransition,
  lifecycleFromListingRow,
} from '@/domains/marketplace/shared/domain/lifecycle-state'
import {
  canPublish,
  isTransactableType,
} from '@/domains/marketplace/shared/application/publication-policy'
import { publicationFromListingRow } from '@/domains/marketplace/publication/infrastructure/listing-adapter'
import { inferTransactionKindFromPublicationTypes } from '@/domains/marketplace/transaction/domain/checkout-strategies'

describe('publication-type-registry', () => {
  it('registers all 12 Ditto publication types', () => {
    expect(Object.keys(PUBLICATION_TYPE_REGISTRY)).toHaveLength(12)
  })

  it('preserves literal publication type codes for discriminated unions', () => {
    const productCode: PublicationTypeCode = 'product'
    expect(productCode).toBe('product')
  })

  it('marks experience as persistable', () => {
    expect(isPersistablePublicationType('experience')).toBe(true)
    expect(getPublicationTypeDefinition('experience')?.ecosystem).toBe('world')
  })

  it('marks recipe as persistable', () => {
    expect(isPersistablePublicationType('recipe')).toBe(true)
  })

  it('marks event and project as persistable', () => {
    expect(isPersistablePublicationType('event')).toBe(true)
    expect(isPersistablePublicationType('project')).toBe(true)
  })
})

describe('lifecycle-state', () => {
  it('maps published+approved listing to published lifecycle', () => {
    expect(
      lifecycleFromListingRow({ status: 'published', moderation_status: 'approved' }),
    ).toBe('published')
  })

  it('allows draft to pending_review', () => {
    expect(canTransition('draft', 'pending_review')).toBe(true)
  })

  it('blocks deleted transitions', () => {
    expect(canTransition('deleted', 'published')).toBe(false)
  })
})

describe('publication-policy', () => {
  it('detects transactable product type', () => {
    expect(isTransactableType('product')).toBe(true)
  })

  it('detects non-transactable recipe type', () => {
    expect(isTransactableType('recipe')).toBe(false)
  })

  it('allows publish from draft when moderation ok', () => {
    expect(
      canPublish({
        publicationType: 'product',
        lifecycle: 'draft',
        moderationStatus: 'pending',
        visibility: 'public',
      }),
    ).toBe(true)
  })
})

describe('listing-adapter', () => {
  it('maps listing row to publication aggregate', () => {
    const pub = publicationFromListingRow({
      id: 'id-1',
      title: 'Pan Integral',
      description: 'Descripción',
      listing_type: 'product',
      category_id: 'cat-1',
      store_id: 'store-1',
      status: 'draft',
      moderation_status: 'pending',
      moderation_reason: null,
      characteristics: { foo: 'bar' },
      latitude: null,
      longitude: null,
      created_at: '2026-01-01T00:00:00Z',
    })

    expect(pub.publicationType).toBe('product')
    expect(pub.structuralRole).toBe('root')
    expect(pub.owner.ownerId).toBe('store-1')
    expect(pub.lifecycle).toBe('draft')
    expect(pub.isTransactable).toBe(true)
  })
})

describe('checkout-strategies', () => {
  it('infers booking for experience publications', () => {
    expect(inferTransactionKindFromPublicationTypes(['experience'])).toBe('booking')
  })

  it('defaults to purchase for products', () => {
    expect(inferTransactionKindFromPublicationTypes(['product'])).toBe('purchase')
  })
})
