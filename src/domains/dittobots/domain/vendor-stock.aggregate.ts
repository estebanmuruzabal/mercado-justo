import type { DittoBotInventoryStatus } from './ditto-bot-inventory-unit'
import { isVendorVisibleInventoryStatus } from './ditto-seller.policy'

export type VendorStockUnit = {
  id: string
  serialNumber: string
  status: DittoBotInventoryStatus
  productId: string | null
  productTitle: string | null
  assignedVendorId?: string | null
  sellerVendorId?: string | null
  createdAt?: string
}

export type VendorStockAggregate = {
  productId: string
  productTitle: string
  assignedCount: number
  availableCount: number
  reservedCount: number
  soldCount: number
}

export function vendorOwnsUnit(unit: VendorStockUnit, vendorStoreId: string): boolean {
  return unit.assignedVendorId === vendorStoreId || unit.sellerVendorId === vendorStoreId
}

export function filterUnitsForVendorStore(
  units: VendorStockUnit[],
  vendorStoreId: string,
): VendorStockUnit[] {
  return units.filter(
    (unit) =>
      vendorOwnsUnit(unit, vendorStoreId) && isVendorVisibleInventoryStatus(unit.status),
  )
}

export function aggregateVendorStockFromUnits(units: VendorStockUnit[]): VendorStockAggregate[] {
  const byProduct = new Map<string, VendorStockAggregate>()

  for (const unit of units) {
    const pid = unit.productId ?? 'unknown'
    const title = unit.productTitle ?? 'Sin producto'
    const current = byProduct.get(pid) ?? {
      productId: pid,
      productTitle: title,
      assignedCount: 0,
      availableCount: 0,
      reservedCount: 0,
      soldCount: 0,
    }

    if (unit.status === 'assigned') {
      current.assignedCount += 1
      current.availableCount += 1
    } else if (unit.status === 'reserved') {
      current.reservedCount += 1
    } else if (
      unit.status === 'sold' ||
      unit.status === 'activated' ||
      unit.status === 'warranty' ||
      unit.status === 'repair'
    ) {
      current.soldCount += 1
    }

    byProduct.set(pid, current)
  }

  return [...byProduct.values()].sort((a, b) => a.productTitle.localeCompare(b.productTitle))
}
