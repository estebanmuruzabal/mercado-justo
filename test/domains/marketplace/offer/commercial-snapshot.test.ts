import { describe, expect, it } from 'vitest'
import {
  mapListingVariantRowToCommercialSnapshot,
  mapOfferVariantsToCommercialSnapshot,
} from '@/domains/marketplace/offer/application/mappers/commercial-snapshot.mapper'
import type { OfferVariant } from '@/domains/marketplace/offer/domain/entities/offer-variant'

function offerVariant(partial: Partial<OfferVariant> & Pick<OfferVariant, 'id'>): OfferVariant {
  return {
    offerId: 'offer-1',
    sku: 'SKU-1',
    name: 'Default',
    price: 500,
    stock: 10,
    attributes: { name: 'Product', image: 'https://example.com/img.jpg' },
    isDefault: false,
    isActive: true,
    legacyVariantId: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('mapOfferVariantsToCommercialSnapshot (A4)', () => {
  it('maps offer_variant path with source offer', () => {
    const snapshot = mapOfferVariantsToCommercialSnapshot('pub-1', [
      offerVariant({ id: 'v1', isDefault: true }),
    ])
    expect(snapshot).toMatchObject({
      publicationId: 'pub-1',
      variantId: 'v1',
      price: 500,
      stock: 10,
      hasOptions: false,
      source: 'offer',
    })
  })

  it('sets hasOptions when multiple active variants', () => {
    const snapshot = mapOfferVariantsToCommercialSnapshot('pub-1', [
      offerVariant({ id: 'v1', isDefault: true }),
      offerVariant({ id: 'v2', createdAt: '2026-01-02T00:00:00Z' }),
    ])
    expect(snapshot?.hasOptions).toBe(true)
  })

  it('maps legacy fallback with source legacy', () => {
    const snapshot = mapOfferVariantsToCommercialSnapshot(
      'pub-1',
      [offerVariant({ id: 'legacy-v1', isDefault: true, legacyVariantId: 'legacy-v1' })],
      'legacy',
    )
    expect(snapshot?.source).toBe('legacy')
  })
})

describe('mapListingVariantRowToCommercialSnapshot', () => {
  it('maps listing_variant row to legacy snapshot', () => {
    const snapshot = mapListingVariantRowToCommercialSnapshot(
      {
        id: 'lv-1',
        listing_id: 'listing-1',
        sku: 'SKU',
        name: 'Variant',
        price: 1200,
        stock: 3,
        is_default: true,
        attributes_json: { color: 'red' },
        created_at: '2026-01-01T00:00:00Z',
      },
      'pub-1',
      2,
    )
    expect(snapshot).toEqual({
      publicationId: 'pub-1',
      variantId: 'lv-1',
      price: 1200,
      stock: 3,
      hasOptions: true,
      sku: 'SKU',
      attributes: { color: 'red' },
      source: 'legacy',
    })
  })
})
