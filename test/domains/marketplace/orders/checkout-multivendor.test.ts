import { describe, expect, it } from 'vitest'

import {
  aggregateCheckoutQuantitiesByListing,
  assertCheckoutListingStock,
  assertNoOwnListings,
  buildCheckoutRpcLines,
  groupCheckoutLinesByVendor,
  type CheckoutListingStockRow,
  type ResolvedCheckoutLine,
} from '@/domains/marketplace/orders/application/checkout-multivendor'

function line(partial: Partial<ResolvedCheckoutLine> & {
  variantId: string
  listingId: string
  quantity?: number
  title?: string
}): ResolvedCheckoutLine {
  return {
    item: {
      variantId: partial.variantId,
      quantity: partial.quantity ?? 1,
      unitPrice: 100,
      storeId: 'payload-store',
      title: partial.title ?? 'Producto',
    },
    variantInfo: {
      listingVariantId: partial.variantId,
      listingId: partial.listingId,
      sku: 'SKU-1',
      attributesJson: {},
    },
  }
}

function listing(row: CheckoutListingStockRow): CheckoutListingStockRow {
  return row
}

describe('checkout multi-vendor helpers', () => {
  it('groups cart lines by real listing vendor', () => {
    const lines = [
      line({ variantId: 'variant-1', listingId: 'listing-1' }),
      line({ variantId: 'variant-2', listingId: 'listing-2' }),
    ]
    const listingsById = new Map([
      ['listing-1', listing({ id: 'listing-1', store_id: 'vendor-1', stock: 5, title: 'A' })],
      ['listing-2', listing({ id: 'listing-2', store_id: 'vendor-2', stock: 5, title: 'B' })],
    ])

    const groups = groupCheckoutLinesByVendor(lines, listingsById)

    expect(groups.get('vendor-1')).toHaveLength(1)
    expect(groups.get('vendor-2')).toHaveLength(1)
  })

  it('validates stock for a normal listing', () => {
    const requested = new Map([['listing-1', 2]])
    const listingsById = new Map([
      ['listing-1', listing({ id: 'listing-1', store_id: 'vendor-1', stock: 2, title: 'Producto' })],
    ])

    expect(() => assertCheckoutListingStock(requested, listingsById)).not.toThrow()
  })

  it('validates DittoBot stock through the same listing stock path', () => {
    const requested = new Map([['dittobot-listing', 1]])
    const listingsById = new Map([
      [
        'dittobot-listing',
        listing({ id: 'dittobot-listing', store_id: 'vendor-1', stock: 1, title: 'DittoBot' }),
      ],
    ])

    expect(() => assertCheckoutListingStock(requested, listingsById)).not.toThrow()
  })

  it('throws a clear error when stock is insufficient', () => {
    const requested = new Map([['listing-1', 3]])
    const listingsById = new Map([
      ['listing-1', listing({ id: 'listing-1', store_id: 'vendor-1', stock: 2, title: 'Producto' })],
    ])

    expect(() => assertCheckoutListingStock(requested, listingsById)).toThrow(
      'Stock insuficiente para Producto.',
    )
  })

  it('blocks checkout when any listing belongs to the buyer', () => {
    const listingsById = new Map([
      ['listing-1', listing({ id: 'listing-1', store_id: 'buyer-1', stock: 2, title: 'Propio' })],
      ['listing-2', listing({ id: 'listing-2', store_id: 'vendor-2', stock: 2, title: 'Otro' })],
    ])

    expect(() => assertNoOwnListings('buyer-1', listingsById)).toThrow(
      'No podés comprar tus propios productos.',
    )
  })

  it('aggregates quantities by listing before checkout', () => {
    const totals = aggregateCheckoutQuantitiesByListing([
      line({ variantId: 'variant-1', listingId: 'listing-1', quantity: 2 }),
      line({ variantId: 'variant-2', listingId: 'listing-1', quantity: 3 }),
    ])

    expect(totals.get('listing-1')).toBe(5)
  })

  it('builds generic RPC lines without DittoBot-specific fields', () => {
    const payload = buildCheckoutRpcLines([
      line({ variantId: 'variant-1', listingId: 'dittobot-listing', quantity: 1, title: 'DittoBot' }),
    ])

    expect(payload).toEqual([
      {
        listing_id: 'dittobot-listing',
        variant_id: 'variant-1',
        quantity: 1,
        unit_price: 100,
        title_snapshot: 'DittoBot',
        variant_snapshot: {
          sku: 'SKU-1',
          attributes_json: {},
        },
      },
    ])
  })
})
