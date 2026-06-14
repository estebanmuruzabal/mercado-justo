import { describe, expect, it } from 'vitest'

import {
  DITTO_BOT_CATALOG_LISTING_STOCK,
  DITTO_BOT_STOCK_INFO_MESSAGE,
} from '@/domains/dittobots/domain/ditto-bot-product-stock'
import {
  parseDittoBotProductInput,
  DittoBotProductValidationError,
} from '@/domains/dittobots/domain/ditto-bot-product'
import { aggregateVendorStockFromUnits } from '@/domains/dittobots/domain/vendor-stock.aggregate'

describe('DittoBot catalog stock constants', () => {
  it('keeps listing stock at zero in catalog', () => {
    expect(DITTO_BOT_CATALOG_LISTING_STOCK).toBe(0)
  })

  it('exposes admin info message for inventory-managed stock', () => {
    expect(DITTO_BOT_STOCK_INFO_MESSAGE).toContain('Inventario y Lotes')
  })
})

describe('parseDittoBotProductInput', () => {
  it('does not accept or return stock field', () => {
    const parsed = parseDittoBotProductInput({
      title: 'DittoBot Mini',
      description: 'Descripción suficientemente larga para validar.',
      categoryId: '10000000-0000-4000-8000-000000000001',
      price: 1000,
      tags: ['dittobot'],
    })

    expect(parsed).not.toHaveProperty('stock')
    expect(parsed.price).toBe(1000)
  })

  it('still validates price', () => {
    expect(() =>
      parseDittoBotProductInput({
        title: 'DittoBot Mini',
        description: 'Descripción suficientemente larga para validar.',
        categoryId: '10000000-0000-4000-8000-000000000001',
        price: 0,
        tags: ['dittobot'],
      }),
    ).toThrow(DittoBotProductValidationError)
  })
})

describe('vendor stock reserved count', () => {
  it('tracks reserved separately from sold', () => {
    const aggregates = aggregateVendorStockFromUnits([
      {
        id: '1',
        serialNumber: 'DTB-1',
        status: 'assigned',
        productId: 'prod-1',
        productTitle: 'Mini',
        assignedVendorId: 'vendor',
      },
      {
        id: '2',
        serialNumber: 'DTB-2',
        status: 'reserved',
        productId: 'prod-1',
        productTitle: 'Mini',
        assignedVendorId: 'vendor',
      },
      {
        id: '3',
        serialNumber: 'DTB-3',
        status: 'sold',
        productId: 'prod-1',
        productTitle: 'Mini',
        assignedVendorId: 'vendor',
      },
    ])

    expect(aggregates[0]).toMatchObject({
      assignedCount: 1,
      availableCount: 1,
      reservedCount: 1,
      soldCount: 1,
    })
  })
})
