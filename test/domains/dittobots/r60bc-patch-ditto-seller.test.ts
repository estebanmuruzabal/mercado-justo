import { describe, expect, it } from 'vitest'

import {
  assertDittoSeller,
  assertDittoSellerAssignmentTarget,
  DittoSellerError,
} from '@/domains/dittobots/domain/ditto-seller.policy'
import {
  aggregateVendorStockFromUnits,
  filterUnitsForVendorStore,
} from '@/domains/dittobots/domain/vendor-stock.aggregate'

describe('DittoSeller policy', () => {
  it('allows DittoSeller store', () => {
    expect(
      assertDittoSeller({ id: 'vendor-a', canSellDittoBots: true }).canSellDittoBots,
    ).toBe(true)
  })

  it('denies non-DittoSeller store', () => {
    expect(() => assertDittoSeller({ id: 'vendor-a', canSellDittoBots: false })).toThrow(
      DittoSellerError,
    )
  })

  it('requires DittoSeller for assignment target', () => {
    expect(() =>
      assertDittoSellerAssignmentTarget({
        canSellDittoBots: false,
        isOfficialDittoBotVendor: false,
      }),
    ).toThrow(DittoSellerError)

    expect(() =>
      assertDittoSellerAssignmentTarget({
        canSellDittoBots: true,
        isOfficialDittoBotVendor: true,
      }),
    ).toThrow(DittoSellerError)
  })
})

describe('vendor assigned stock visibility', () => {
  const vendorA = '10000000-0000-4000-8000-000000000031'
  const vendorB = '10000000-0000-4000-8000-000000000032'

  const units = [
    {
      id: '1',
      serialNumber: 'DTB-000001',
      status: 'assigned' as const,
      productId: 'prod-1',
      productTitle: 'DittoBot Mini',
      assignedVendorId: vendorA,
      sellerVendorId: null,
    },
    {
      id: '2',
      serialNumber: 'DTB-000002',
      status: 'assigned' as const,
      productId: 'prod-1',
      productTitle: 'DittoBot Mini',
      assignedVendorId: vendorA,
      sellerVendorId: null,
    },
    {
      id: '3',
      serialNumber: 'DTB-000003',
      status: 'assigned' as const,
      productId: 'prod-1',
      productTitle: 'DittoBot Mini',
      assignedVendorId: vendorA,
      sellerVendorId: null,
    },
    {
      id: '4',
      serialNumber: 'DTB-000004',
      status: 'available' as const,
      productId: 'prod-1',
      productTitle: 'DittoBot Mini',
      assignedVendorId: null,
      sellerVendorId: null,
    },
  ]

  it('vendor A sees 3 assigned units, vendor B sees none', () => {
    expect(filterUnitsForVendorStore(units, vendorA)).toHaveLength(3)
    expect(filterUnitsForVendorStore(units, vendorB)).toHaveLength(0)
  })

  it('aggregate available = 3 for assigned units', () => {
    const aggregates = aggregateVendorStockFromUnits(filterUnitsForVendorStore(units, vendorA))
    expect(aggregates).toHaveLength(1)
    expect(aggregates[0]?.availableCount).toBe(3)
    expect(aggregates[0]?.assignedCount).toBe(3)
  })

  it('aggregate sold count increases when unit is sold', () => {
    const soldUnits = units.slice(0, 3).map((unit, index) =>
      index === 0 ? { ...unit, status: 'sold' as const } : unit,
    )
    const aggregates = aggregateVendorStockFromUnits(
      filterUnitsForVendorStore(soldUnits, vendorA),
    )
    expect(aggregates[0]?.availableCount).toBe(2)
    expect(aggregates[0]?.soldCount).toBe(1)
  })
})

describe('DittoBot product images characteristics', () => {
  it('builds listing characteristics with primary image and gallery', async () => {
    const { buildDittoBotCharacteristics } = await import('@/domains/dittobots/domain/ditto-bot-product')
    const characteristics = buildDittoBotCharacteristics({
      tags: ['iot'],
      image: 'https://example.com/main.jpg',
      images: ['https://example.com/g1.jpg'],
    })
    expect(characteristics).toEqual({
      tags: ['iot'],
      image: 'https://example.com/main.jpg',
      images: ['https://example.com/g1.jpg'],
    })
  })
})
