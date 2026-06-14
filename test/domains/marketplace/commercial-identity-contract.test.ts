import { afterEach, describe, expect, it } from 'vitest'

import { mapOfferVariantsToCommercialSnapshot } from '@/domains/marketplace/offer/application/mappers/commercial-snapshot.mapper'
import type { OfferVariant } from '@/domains/marketplace/offer/domain/entities/offer-variant'
import { TRANSACTIONAL_VARIANT_ID_CONTRACT } from '@/domains/marketplace/offer/domain/commercial-identity-contract'
import {
  buildOrderItemsPayloadFromResolved,
} from '@/domains/marketplace/orders/application/checkout-order-items'
import {
  getCheckoutVariantFallbackMetrics,
  resetCheckoutVariantFallbackMetrics,
} from '@/domains/marketplace/orders/application/checkout-variant-fallback.metrics'
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

function mockSupabaseForOfferFallback() {
  const listingVariant = {
    id: 'listing-v1',
    listing_id: 'listing-1',
    sku: 'sku-1',
    attributes_json: {},
  }
  let listingCalls = 0
  return {
    supabase: {
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
    } as never,
  }
}

afterEach(() => {
  resetCheckoutVariantFallbackMetrics()
})

describe('QA-ID-01 discovery emits listing_variant.id', () => {
  it('mapOfferVariantsToCommercialSnapshot uses legacyVariantId for variantId', () => {
    const snapshot = mapOfferVariantsToCommercialSnapshot('pub-1', [
      offerVariant({ id: 'offer-v1', legacyVariantId: 'listing-v1' }),
    ])
    expect(snapshot?.variantId).toBe('listing-v1')
    expect(snapshot?.variantId).not.toBe('offer-v1')
  })
})

describe('QA-ID-02 checkout accepts listing_variant.id directly', () => {
  it('resolveCheckoutVariants returns listing row when cart has listing id', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          in: async () => ({
            data: [
              {
                id: 'listing-v1',
                listing_id: 'listing-1',
                sku: 'sku-1',
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
    expect(getCheckoutVariantFallbackMetrics().fallbackHits).toBe(0)
  })
})

describe('QA-ID-03 legacy offer_variant.id in cart resolves', () => {
  it('resolveCheckoutVariants maps offer id to listing_variant id', async () => {
    const { supabase } = mockSupabaseForOfferFallback()
    const resolved = await resolveCheckoutVariants(supabase, ['offer-v1'])
    expect(resolved.get('offer-v1')?.listingVariantId).toBe('listing-v1')
  })
})

describe('QA-ID-04 order payload uses listing_variant.id', () => {
  it('buildOrderItemsPayloadFromResolved never uses cart offer id as variant_id', () => {
    const payload = buildOrderItemsPayloadFromResolved('order-1', [
      {
        item: { quantity: 2, unitPrice: 100, title: 'Bot' },
        variantInfo: {
          cartVariantId: 'offer-v1',
          listingVariantId: 'listing-v1',
          listingId: 'listing-1',
          sku: 'sku-1',
          attributesJson: {},
        },
      },
    ])
    expect(payload[0]?.variant_id).toBe('listing-v1')
    expect(payload[0]?.variant_id).not.toBe('offer-v1')
  })

  it('ResolvedCheckoutVariant.listingVariantId is always the listing_variant row id', async () => {
    const { supabase } = mockSupabaseForOfferFallback()
    const resolved = await resolveCheckoutVariants(supabase, ['offer-v1'])
    const row = resolved.get('offer-v1')
    expect(row?.listingVariantId).toBe('listing-v1')
    expect(row?.listingVariantId).toBe(row?.cartVariantId === 'offer-v1' ? 'listing-v1' : row?.listingVariantId)
  })
})

describe('checkout variant fallback metrics', () => {
  it('increments fallbackHits when offer branch resolves cart ids', async () => {
    const { supabase } = mockSupabaseForOfferFallback()
    await resolveCheckoutVariants(supabase, ['offer-v1'])
    expect(getCheckoutVariantFallbackMetrics().fallbackHits).toBe(1)
  })
})

describe('commercial identity contract constant', () => {
  it('documents transactional variant id rule', () => {
    expect(TRANSACTIONAL_VARIANT_ID_CONTRACT).toContain('listing_variant.id')
  })
})
