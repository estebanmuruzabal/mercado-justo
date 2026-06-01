import { describe, expect, it } from 'vitest'

import {
  aggregateCheckoutQuantitiesByListing,
  DittoBotCheckoutStockError,
  validateDittoBotCheckoutStock,
} from '@/domains/dittobots/domain/ditto-bot-checkout-stock'
import {
  mapOfferVariantsToCommercialSnapshot,
} from '@/domains/marketplace/offer/application/mappers/commercial-snapshot.mapper'
import type { OfferVariant } from '@/domains/marketplace/offer/domain/entities/offer-variant'
import { resolveCheckoutVariants } from '@/domains/marketplace/orders/application/checkout-variant.resolver'

function offerVariant(partial: Partial<OfferVariant> & Pick<OfferVariant, 'id'>): OfferVariant {
  return {
    offerId: 'offer-1',
    sku: 'SKU-1',
    name: 'Default',
    price: 500,
    stock: 10,
    attributes: {},
    isDefault: true,
    isActive: true,
    legacyVariantId: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('QA-DITTOBOT-CHECKOUT-01 offer id bridge', () => {
  it('commercial snapshot exposes listing_variant id for cart/checkout', () => {
    const snapshot = mapOfferVariantsToCommercialSnapshot('pub-1', [
      offerVariant({ id: 'offer-v1', legacyVariantId: 'listing-v1' }),
    ])
    expect(snapshot?.variantId).toBe('listing-v1')
  })

  it('resolveCheckoutVariants maps offer_variant cart id to listing_variant', async () => {
    const listingVariant = {
      id: 'listing-v1',
      listing_id: 'listing-1',
      sku: 'dtb-sku',
      attributes_json: { tags: ['dittobot'] },
    }

    let listingCalls = 0
    const supabase = {
      from: (table: string) => {
        if (table === 'listing_variant') {
          listingCalls += 1
          return {
            select: () => ({
              in: async () => ({
                data: listingCalls === 1 ? [] : [listingVariant],
                error: null,
              }),
            }),
          }
        }
        if (table === 'offer_variant') {
          return {
            select: () => ({
              in: () => ({
                eq: async () => ({
                  data: [{ id: 'offer-v1', legacy_variant_id: 'listing-v1' }],
                  error: null,
                }),
              }),
            }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    }

    const resolved = await resolveCheckoutVariants(supabase as never, ['offer-v1'])
    expect(resolved.get('offer-v1')).toMatchObject({
      cartVariantId: 'offer-v1',
      listingVariantId: 'listing-v1',
      listingId: 'listing-1',
      sku: 'dtb-sku',
    })
  })
})

describe('QA-DITTOBOT-CHECKOUT-02 variant coherence', () => {
  it('resolveCheckoutVariants returns listing variant when cart already has listing id', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          in: async () => ({
            data: [
              {
                id: 'listing-v1',
                listing_id: 'listing-1',
                sku: 'dtb-sku',
                attributes_json: {},
              },
            ],
            error: null,
          }),
        }),
      }),
    }

    const resolved = await resolveCheckoutVariants(supabase as never, ['listing-v1'])
    expect(resolved.get('listing-v1')?.listingVariantId).toBe('listing-v1')
  })
})

describe('QA-DITTOBOT-CHECKOUT-03 zero assigned stock', () => {
  it('blocks checkout when assigned stock is zero', () => {
    expect(() =>
      validateDittoBotCheckoutStock({
        dittoBotListingIds: ['product-1'],
        quantitiesByListingId: new Map([['product-1', 1]]),
        stockByProductId: new Map([['product-1', 0]]),
      }),
    ).toThrow(DittoBotCheckoutStockError)
  })
})

describe('QA-DITTOBOT-CHECKOUT-04 assigned stock limits', () => {
  it('allows quantity equal to assigned stock', () => {
    expect(() =>
      validateDittoBotCheckoutStock({
        dittoBotListingIds: ['product-1'],
        quantitiesByListingId: new Map([['product-1', 5]]),
        stockByProductId: new Map([['product-1', 5]]),
      }),
    ).not.toThrow()
  })

  it('blocks quantity greater than assigned stock', () => {
    expect(() =>
      validateDittoBotCheckoutStock({
        dittoBotListingIds: ['product-1'],
        quantitiesByListingId: new Map([['product-1', 6]]),
        stockByProductId: new Map([['product-1', 5]]),
      }),
    ).toThrow(/Stock insuficiente/)
  })

  it('aggregates quantities for the same DittoBot listing', () => {
    const totals = aggregateCheckoutQuantitiesByListing([
      { listingId: 'product-1', quantity: 2 },
      { listingId: 'product-1', quantity: 3 },
    ])
    expect(totals.get('product-1')).toBe(5)
  })
})
