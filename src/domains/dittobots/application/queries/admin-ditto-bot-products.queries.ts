import { createAdminClient } from '@/shared/database/admin-client'

import type { DittoBotInventoryUnitAdmin } from '../../domain/ditto-bot-inventory-unit'
import {
  findOfficialDittoBotVendor,
  listDittoBotProductsAdmin,
  listRegionalVendorsAdmin,
  listRegionalVendorsForDittoSellerManage,
  type DittoBotProductRow,
  type RegionalVendorManageRow,
  type RegionalVendorRow,
} from '../../infrastructure/ditto-bot-product.repository'
import {
  listUnitsAdmin,
  type AdminInventoryFilters,
} from '../../infrastructure/ditto-bot-inventory.repository'

export type { DittoBotProductRow, RegionalVendorRow, RegionalVendorManageRow, AdminInventoryFilters }

export async function getOfficialDittoBotVendorForAdmin() {
  const admin = createAdminClient()
  return findOfficialDittoBotVendor(admin)
}

export async function listRegionalVendorsForDittoSellerAdmin(): Promise<RegionalVendorManageRow[]> {
  const admin = createAdminClient()
  return listRegionalVendorsForDittoSellerManage(admin)
}

export async function listDittoBotProductsForAdmin(): Promise<DittoBotProductRow[]> {
  const admin = createAdminClient()
  return listDittoBotProductsAdmin(admin)
}

export async function listDittoBotInventoryAdmin(
  filters?: AdminInventoryFilters,
): Promise<DittoBotInventoryUnitAdmin[]> {
  const admin = createAdminClient()
  return listUnitsAdmin(admin, filters)
}

export async function listRegionalVendorsForAssignment(): Promise<RegionalVendorRow[]> {
  const admin = createAdminClient()
  return listRegionalVendorsAdmin(admin)
}

export async function listAvailableUnitsForAssignment(): Promise<DittoBotInventoryUnitAdmin[]> {
  const admin = createAdminClient()
  return listUnitsAdmin(admin, { status: 'available' })
}
