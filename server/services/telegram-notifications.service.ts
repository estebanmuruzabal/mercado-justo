import { createServiceClient } from '@/lib/supabase/service'
import { isTelegramConfigured } from '@/lib/telegram/config'

import { sendVendorTelegramEvent } from './telegram.service'

/**
 * App-event → Telegram bridges. Each function gathers the data a given domain
 * event needs and hands a typed payload to the generic dispatcher.
 *
 * These run in fire-and-forget contexts (e.g. Next.js `after()`), so they use
 * the service-role client and never throw.
 */

/** Phase 1: notify the seller of a newly created order. */
export async function notifyVendorNewOrder(orderId: string): Promise<void> {
  if (!isTelegramConfigured()) return

  try {
    const service = createServiceClient()

    const { data: order, error: orderError } = await service
      .from('order')
      .select('id, seller_id, buyer_id, total')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) return

    const [{ data: items }, { data: buyer }] = await Promise.all([
      service.from('order_item').select('title_snapshot, quantity').eq('order_id', orderId),
      service.from('user').select('full_name').eq('id', order.buyer_id).maybeSingle(),
    ])

    await sendVendorTelegramEvent(order.seller_id, {
      type: 'new_order',
      payload: {
        orderId: order.id,
        buyerName: buyer?.full_name?.trim() || 'Cliente',
        total: Number(order.total) || 0,
        items: (items ?? []).map((item) => ({
          title: item.title_snapshot,
          quantity: item.quantity,
        })),
      },
    })
  } catch (err) {
    console.error('[telegram] notifyVendorNewOrder failed:', err instanceof Error ? err.message : err)
  }
}
