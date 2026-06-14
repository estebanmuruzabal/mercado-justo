import { absoluteUrl } from '@/shared/config/environment'
import { isEmailConfigured } from '@/shared/events/legacy-notifications/email/config'
import { emailElement, sendEmail } from '@/shared/events/legacy-notifications/email/send'
import { PROFILE_SALES_PATH } from '@/shared/routing/routes'
import { createServiceClient } from '@/shared/database/supabase/service'
import type { DeliveryResult } from '@/shared/events/legacy-notifications/channels/types'
import { OrderCreatedEmail } from '@/emails/order-created'

import { formatEmailCurrency } from './format'
import { getUserEmail } from './recipients'

/**
 * Notify the buyer that their order was created (operational email via Resend).
 */
export async function sendOrderCreatedEmail(orderId: string): Promise<DeliveryResult> {
  if (!isEmailConfigured()) return { delivered: false, reason: 'not_configured' }

  try {
    const service = createServiceClient()

    const { data: order, error: orderError } = await service
      .from('order')
      .select('id, buyer_id, seller_id, total')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) return { delivered: false, reason: 'order_not_found' }

    const [{ data: buyer }, { data: store }] = await Promise.all([
      service.from('user').select('full_name').eq('id', order.buyer_id).maybeSingle(),
      service.from('store').select('name').eq('id', order.seller_id).maybeSingle(),
    ])

    const email = await getUserEmail(order.buyer_id)
    if (!email) return { delivered: false, reason: 'no_recipient' }

    return sendEmail({
      to: email,
      subject: `Pedido confirmado — ${store?.name ?? 'Mercado Justo'}`,
      react: emailElement(OrderCreatedEmail, {
        buyerName: buyer?.full_name?.trim() || 'Cliente',
        orderId: order.id,
        storeName: store?.name ?? 'Tienda',
        total: formatEmailCurrency(Number(order.total) || 0),
        orderUrl: absoluteUrl(PROFILE_SALES_PATH),
      }),
    })
  } catch (err) {
    console.error(
      '[email] sendOrderCreatedEmail failed:',
      err instanceof Error ? err.message : err,
    )
    return { delivered: false, reason: err instanceof Error ? err.message : 'unknown' }
  }
}
