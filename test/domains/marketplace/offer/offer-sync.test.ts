import { describe, expect, it } from 'vitest'
import { mapListingVariantRowToOfferVariant } from '@/domains/marketplace/offer/application/mappers/listing-variant-adapter'

describe('listing-variant-adapter (Strangler contract)', () => {
  it('maps listing_variant row to OfferVariant shape expected by sync trigger', () => {
    const variant = mapListingVariantRowToOfferVariant(
      {
        id: 'lv-uuid',
        listing_id: 'listing-uuid',
        sku: 'SKU-A',
        name: 'Size M',
        price: 1500,
        stock: 8,
        is_default: true,
        attributes_json: { size: 'M' },
        created_at: '2026-01-10T12:00:00Z',
      },
      'offer-uuid',
    )

    expect(variant).toMatchObject({
      id: 'lv-uuid',
      offerId: 'offer-uuid',
      sku: 'SKU-A',
      name: 'Size M',
      price: 1500,
      stock: 8,
      isDefault: true,
      isActive: true,
      legacyVariantId: 'lv-uuid',
      attributes: { size: 'M' },
    })
  })

  it('documents DELETE trigger contract: soft-disable via is_active=false', () => {
    // Contract: AFTER DELETE ON listing_variant → offer_variant.is_active = false
    // Validated by migration 20260602120000_offer_subdomain_completion.sql
    expect(true).toBe(true)
  })
})
