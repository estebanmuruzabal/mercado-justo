/** DittoBot catalog listings never use listing.stock as source of truth — always 0 at rest. */
export const DITTO_BOT_CATALOG_LISTING_STOCK = 0

export const DITTO_BOT_STOCK_INFO_MESSAGE =
  'El stock de DittoBots se administra desde Inventario y Lotes. No puede editarse desde el producto.'

import type { DittoBotInventoryStatus } from './ditto-bot-inventory-unit'

/** Physical unit statuses that count as publicly sellable (regional assignment only). */
export const DITTO_BOT_PUBLIC_SELLABLE_STATUSES = ['assigned'] as const

export type PublicSellableStockUnit = {
  productId: string | null
  status: DittoBotInventoryStatus
  assignedVendorId?: string | null
}

/** Mirrors `ditto_bot_public_stock_by_product` RPC for unit tests (no DB). */
export function countPublicSellableAssignedUnits(
  units: PublicSellableStockUnit[],
  productIds?: string[],
): Map<string, number> {
  const filterIds = productIds && productIds.length > 0 ? new Set(productIds) : null
  const counts = new Map<string, number>()

  for (const unit of units) {
    if (!unit.productId) continue
    if (filterIds && !filterIds.has(unit.productId)) continue
    if (
      DITTO_BOT_PUBLIC_SELLABLE_STATUSES.includes(
        unit.status as (typeof DITTO_BOT_PUBLIC_SELLABLE_STATUSES)[number],
      ) &&
      unit.assignedVendorId != null
    ) {
      counts.set(unit.productId, (counts.get(unit.productId) ?? 0) + 1)
    }
  }

  return counts
}
