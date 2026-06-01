import { createAdminClient } from '@/shared/database/admin-client'
import { listAllUnitsAdmin } from '../../infrastructure/ditto-bot-inventory.repository'
import type { DittoBotInventoryUnit } from '../../domain/ditto-bot-inventory-unit'

export type AdminDittoBotInventoryRow = DittoBotInventoryUnit

export async function listDittoBotInventoryForAdmin(
  searchSerial?: string,
): Promise<AdminDittoBotInventoryRow[]> {
  const admin = createAdminClient()
  return listAllUnitsAdmin(admin, searchSerial)
}
