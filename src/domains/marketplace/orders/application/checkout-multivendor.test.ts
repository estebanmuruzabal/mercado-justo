import { describe, expect, it } from 'vitest'

import {
  aggregateCheckoutQuantitiesByVariant,
  assertCheckoutVariantStock,
  type ResolvedCheckoutLine,
  type CheckoutVariantStockRow,
} from './checkout-multivendor'

function buildLine(params: {
  listingId: string
  variantId: string
  quantity: number
}): ResolvedCheckoutLine {
  return {
    item: {
      variantId: params.variantId,
      quantity: params.quantity,
      unitPrice: 10,
      storeId: 'store-1',
      title: 'Test item',
    },
    variantInfo: {
      listingVariantId: params.variantId,
      listingId: params.listingId,
      sku: `sku-${params.variantId}`,
      attributesJson: {},
    },
  }
}

function variantStockMap(rows: CheckoutVariantStockRow[]) {
  return new Map(rows.map((row) => [row.id, row]))
}

describe('checkout variant stock', () => {
  it('permits purchase when listing stock is irrelevant and variant stock is available', () => {
    const resolvedLines = [buildLine({ listingId: 'listing-a', variantId: 'variant-a', quantity: 1 })]
    const requested = aggregateCheckoutQuantitiesByVariant(resolvedLines)

    expect(() =>
      assertCheckoutVariantStock(
        requested,
        variantStockMap([
          { id: 'variant-a', listing_id: 'listing-a', stock: 10 },
        ]),
      ),
    ).not.toThrow()
  })

  it('rejects purchase when the selected variant has no stock', () => {
    const resolvedLines = [buildLine({ listingId: 'listing-a', variantId: 'variant-a', quantity: 1 })]
    const requested = aggregateCheckoutQuantitiesByVariant(resolvedLines)

    expect(() =>
      assertCheckoutVariantStock(
        requested,
        variantStockMap([
          { id: 'variant-a', listing_id: 'listing-a', stock: 0 },
        ]),
      ),
    ).toThrow('Stock insuficiente')
  })

  it('permits purchase for a different in-stock variant even if the parent listing stock is zero', () => {
    const resolvedLines = [buildLine({ listingId: 'listing-a', variantId: 'variant-b', quantity: 2 })]
    const requested = aggregateCheckoutQuantitiesByVariant(resolvedLines)

    expect(() =>
      assertCheckoutVariantStock(
        requested,
        variantStockMap([
          { id: 'variant-a', listing_id: 'listing-a', stock: 5 },
          { id: 'variant-b', listing_id: 'listing-a', stock: 3 },
        ]),
      ),
    ).not.toThrow()
  })
})
