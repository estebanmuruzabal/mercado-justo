import { createServiceClient } from '@/shared/database/supabase/service'
import { createLogger } from '@/shared/lib/logger/logger'

const logDittoBotSale = createLogger('dittobots.completeSale')

export type DittoBotSaleLine = {
  orderItemId: string
  productId: string
  quantity: number
}

export type DittoBotOrderItemForSale = {
  id: string
  listing_id: string
  quantity: number
}

export type CompleteDittoBotSaleInput = {
  orderId: string
  buyerUserId: string
  sellerVendorId: string
  lines: DittoBotSaleLine[]
}

export function buildDittoBotSaleLines(
  orderItems: DittoBotOrderItemForSale[],
  dittoBotProductIds: Iterable<string>,
): DittoBotSaleLine[] {
  const dittoBotIds = new Set(dittoBotProductIds)

  return orderItems
    .filter((item) => dittoBotIds.has(item.listing_id))
    .map((item) => ({
      orderItemId: item.id,
      productId: item.listing_id,
      quantity: item.quantity,
    }))
}

export async function completeDittoBotSaleForOrder(
  input: CompleteDittoBotSaleInput,
): Promise<{ soldUnitIds: string[] }> {
  const lines = input.lines.filter((line) => line.quantity > 0)
  if (lines.length === 0) return { soldUnitIds: [] }

  const service = createServiceClient()
  const soldAt = new Date().toISOString()
  const soldUnitIds: string[] = []
  logDittoBotSale.debug('completing ditto bot sale', { orderId: input.orderId, lineCount: lines.length })
  for (const line of lines) {
    const { data: candidateRows, error: candidateError } = await service
      .from('ditto_bot_inventory_unit')
      .select('id')
      .eq('assigned_vendor_id', input.sellerVendorId)
      .eq('status', 'assigned')
      .is('owner_user_id', null)
      .is('order_id', null)
      .order('serial_number', { ascending: true })
      .limit(line.quantity)

    if (candidateError) throw candidateError
    logDittoBotSale.trace('candidate inventory units loaded', {
      productId: line.productId,
      requested: line.quantity,
      found: (candidateRows ?? []).length,
    })
    const unitIds = ((candidateRows ?? []) as Array<{ id: string }>).map((unit) => unit.id)
    if (unitIds.length < line.quantity) {
      throw new Error('Stock DittoBot insuficiente para completar la venta.')
    }

    const { data: updatedRows, error: updateError } = await service
      .from('ditto_bot_inventory_unit')
      .update({
        status: 'sold',
        sold_at: soldAt,
        owner_user_id: input.buyerUserId,
        seller_vendor_id: input.sellerVendorId,
        order_id: input.orderId,
        order_item_id: line.orderItemId,
        updated_at: soldAt,
      } as never)
      .in('id', unitIds)
      .eq('status', 'assigned')
      .select('id')

    if (updateError) throw updateError

    const updatedIds = ((updatedRows ?? []) as Array<{ id: string }>).map((unit) => unit.id)
    if (updatedIds.length !== unitIds.length) {
      throw new Error('No se pudo confirmar la venta de todas las unidades DittoBot.')
    }

    soldUnitIds.push(...updatedIds)
  }

  return { soldUnitIds }
}
