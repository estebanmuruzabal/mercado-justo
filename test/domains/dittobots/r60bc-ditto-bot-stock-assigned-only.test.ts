import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  DITTO_BOT_PUBLIC_SELLABLE_STATUSES,
  countPublicSellableAssignedUnits,
} from '@/domains/dittobots/domain/ditto-bot-product-stock'
import {
  aggregateVendorStockFromUnits,
  filterUnitsForVendorStore,
} from '@/domains/dittobots/domain/vendor-stock.aggregate'

const productId = '10000000-0000-4000-8000-000000000101'
const vendorA = '10000000-0000-4000-8000-000000000031'
const vendorB = '10000000-0000-4000-8000-000000000032'

function unit(
  id: string,
  status: 'available' | 'assigned' | 'sold',
  assignedVendorId: string | null,
) {
  return {
    productId,
    status,
    assignedVendorId,
    id,
    serialNumber: id,
    productTitle: 'DittoBot Mini',
    sellerVendorId: null as string | null,
  }
}

describe('QA-STOCK public sellable = assigned only', () => {
  it('QA-STOCK-01: 100 available + 0 assigned => public stock 0', () => {
    expect(DITTO_BOT_PUBLIC_SELLABLE_STATUSES).toEqual(['assigned'])
    const units = Array.from({ length: 100 }, (_, i) =>
      unit(`avail-${i}`, 'available', null),
    )
    expect(countPublicSellableAssignedUnits(units, [productId]).get(productId) ?? 0).toBe(0)
  })

  it('QA-STOCK-02: 100 available + 10 assigned => marketplace stock 10', () => {
    const units = [
      ...Array.from({ length: 100 }, (_, i) => unit(`avail-${i}`, 'available', null)),
      ...Array.from({ length: 10 }, (_, i) => unit(`asgn-${i}`, 'assigned', vendorA)),
    ]
    expect(countPublicSellableAssignedUnits(units, [productId]).get(productId)).toBe(10)
  })

  it('QA-STOCK-03: vendor A 5 assigned, vendor B 7 assigned => 5 and 7; public total 12', () => {
    const units = [
      ...Array.from({ length: 5 }, (_, i) => unit(`a-${i}`, 'assigned', vendorA)),
      ...Array.from({ length: 7 }, (_, i) => unit(`b-${i}`, 'assigned', vendorB)),
    ]

    const aggA = aggregateVendorStockFromUnits(filterUnitsForVendorStore(units, vendorA))
    const aggB = aggregateVendorStockFromUnits(filterUnitsForVendorStore(units, vendorB))
    expect(aggA[0]?.assignedCount).toBe(5)
    expect(aggB[0]?.assignedCount).toBe(7)

    const publicByProduct = countPublicSellableAssignedUnits(units, [productId])
    expect(publicByProduct.get(productId)).toBe(12)
  })

  it('QA-STOCK-04: assigned -> sold decreases marketplace stock', () => {
    const before = [
      unit('1', 'assigned', vendorA),
      unit('2', 'assigned', vendorA),
      unit('3', 'assigned', vendorA),
    ]
    expect(countPublicSellableAssignedUnits(before, [productId]).get(productId)).toBe(3)

    const after = [
      { ...before[0], status: 'sold' as const },
      before[1],
      before[2],
    ]
    expect(countPublicSellableAssignedUnits(after, [productId]).get(productId)).toBe(2)

    const vendorAgg = aggregateVendorStockFromUnits(filterUnitsForVendorStore(after, vendorA))
    expect(vendorAgg[0]?.availableCount).toBe(2)
    expect(vendorAgg[0]?.soldCount).toBe(1)
  })
})

describe('QA-STOCK vendor path does not use public RPC', () => {
  it('vendor queries and panel avoid ditto_bot_public_stock_by_product', () => {
    const root = process.cwd()
    const vendorQueries = readFileSync(
      join(root, 'src/domains/dittobots/application/queries/vendor-ditto-bots.queries.ts'),
      'utf8',
    )
    const vendorPanel = readFileSync(
      join(root, 'src/domains/dittobots/presentation/vendor-dittobots-panel.tsx'),
      'utf8',
    )

    expect(vendorQueries).not.toMatch(/ditto_bot_public_stock|countDittoBotPublicStock/)
    expect(vendorPanel).not.toMatch(/ditto_bot_public_stock|countDittoBotPublicStock/)
    expect(vendorQueries).toContain('aggregateVendorStock')
  })
})
