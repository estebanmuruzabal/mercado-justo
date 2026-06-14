import { createClient } from '@/shared/database/supabase/server'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'

import {
  aggregateVendorStock,
  listUnitsForVendor,
  type VendorInventoryUnitRow,
  type VendorStockAggregate,
} from '../../infrastructure/ditto-bot-inventory.repository'
import { assertDittoSeller, DittoSellerError } from '../../domain/ditto-seller.policy'

export type { VendorInventoryUnitRow, VendorStockAggregate }

export class VendorDittoBotAccessError extends DittoSellerError {}

async function requireDittoSellerStore(userId: string) {
  const store = await requireVendorStore(userId)
  if (!store) return null
  try {
    assertDittoSeller({
      id: store.id,
      canSellDittoBots: store.canSellDittoBots,
      isOfficialDittoBotVendor: store.isOfficialDittoBotVendor,
    })
  } catch (err) {
    if (err instanceof DittoSellerError) {
      throw new VendorDittoBotAccessError(err.message)
    }
    throw err
  }
  return store
}

export async function getVendorStoreForUser(userId: string) {
  return getStoreByUserId(userId)
}

export async function listVendorDittoBotStock(userId: string): Promise<VendorStockAggregate[]> {
  const store = await requireDittoSellerStore(userId)
  if (!store) return []
  return aggregateVendorStock(store.id)
}

export async function listVendorDittoBotUnits(
  userId: string,
  productId?: string,
): Promise<VendorInventoryUnitRow[]> {
  const store = await requireDittoSellerStore(userId)
  if (!store) return []
  return listUnitsForVendor(store.id, productId)
}

export async function vendorHasDittoSellerAccess(userId: string): Promise<boolean> {
  const store = await requireVendorStore(userId)
  if (!store) return false
  return store.canSellDittoBots && !store.isOfficialDittoBotVendor
}

export async function requireVendorStore(userId: string) {
  const store = await getStoreByUserId(userId)
  if (!store) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store')
    .select('id, name, slug, is_official_ditto_bot_vendor, can_sell_ditto_bots')
    .eq('id', store.id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as {
    id: string
    name: string
    slug: string
    is_official_ditto_bot_vendor: boolean
    can_sell_ditto_bots: boolean
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isOfficialDittoBotVendor: row.is_official_ditto_bot_vendor,
    canSellDittoBots: row.can_sell_ditto_bots,
  }
}
