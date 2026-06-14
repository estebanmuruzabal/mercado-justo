import { createAdminClient } from '@/shared/database/admin-client'

import type { DittoBotInventoryUnitAdmin } from '../../domain/ditto-bot-inventory-unit'
import { listUnitsAdmin } from '../../infrastructure/ditto-bot-inventory.repository'

/** @deprecated Use listDittoBotInventoryAdmin from admin-ditto-bot-products.queries */
export type AdminDittoBotInventoryRow = DittoBotInventoryUnitAdmin

/** @deprecated Use listDittoBotInventoryAdmin from admin-ditto-bot-products.queries */
export async function listDittoBotInventoryForAdmin(
  searchSerial?: string,
): Promise<AdminDittoBotInventoryRow[]> {
  const admin = createAdminClient()
  return listUnitsAdmin(admin, searchSerial ? { serial: searchSerial } : {})
}
