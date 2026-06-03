import { createServiceClient } from '@/shared/database/supabase/service'

export type CountDittoBotSellableStockInput = {
  sellerVendorId: string
}

/**
 * Counts physical units that checkout can immediately attach to an order.
 * This intentionally mirrors completeDittoBotSaleForOrder's candidate filters.
 */
export async function countDittoBotSellableStockForVendor(
  input: CountDittoBotSellableStockInput,
): Promise<number> {
  const service = createServiceClient()
  const { count, error } = await service
    .from('ditto_bot_inventory_unit')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_vendor_id', input.sellerVendorId)
    .eq('status', 'assigned')
    .is('owner_user_id', null)
    .is('order_id', null)

  if (error) throw error
  return count ?? 0
}
