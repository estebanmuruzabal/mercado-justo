import { absoluteUrl } from '@/lib/config/environment'
import { isEmailConfigured } from '@/lib/notifications/email/config'
import { emailElement, sendEmail } from '@/lib/notifications/email/send'
import { PROFILE_SALES_PATH } from '@/lib/routes'
import { createServiceClient } from '@/lib/supabase/service'
import type { DeliveryResult } from '@/lib/notifications/channels/types'
import type { ShipmentDelayedPayload } from '@/lib/notifications/events/types'
import { DeliveryIncidentEmail } from '@/emails/delivery-incident'

import { getUserEmail } from './recipients'

export async function sendDeliveryIncidentEmail(
  input: ShipmentDelayedPayload,
): Promise<DeliveryResult> {
  if (!isEmailConfigured()) return { delivered: false, reason: 'not_configured' }

  try {
    const service = createServiceClient()

    const { data: order, error: orderError } = await service
      .from('order')
      .select('id, buyer_id')
      .eq('id', input.orderId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) return { delivered: false, reason: 'order_not_found' }

    const [{ data: buyer }, email] = await Promise.all([
      service.from('user').select('full_name').eq('id', order.buyer_id).maybeSingle(),
      getUserEmail(order.buyer_id),
    ])

    if (!email) return { delivered: false, reason: 'no_recipient' }

    return sendEmail({
      to: email,
      subject: 'Incidencia en tu envío',
      react: emailElement(DeliveryIncidentEmail, {
        recipientName: buyer?.full_name?.trim() || 'Cliente',
        orderId: order.id,
        incidentDescription: input.incidentDescription,
        supportUrl: absoluteUrl(PROFILE_SALES_PATH),
      }),
    })
  } catch (err) {
    console.error(
      '[email] sendDeliveryIncidentEmail failed:',
      err instanceof Error ? err.message : err,
    )
    return { delivered: false, reason: err instanceof Error ? err.message : 'unknown' }
  }
}
