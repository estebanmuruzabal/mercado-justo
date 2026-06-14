import { absoluteUrl } from '@/shared/config/environment'
import { isEmailConfigured } from '@/shared/events/legacy-notifications/email/config'
import { emailElement, sendEmail } from '@/shared/events/legacy-notifications/email/send'
import { VENDOR_DASHBOARD_PATH } from '@/shared/routing/routes'
import { createServiceClient } from '@/shared/database/supabase/service'
import type { DeliveryResult } from '@/shared/events/legacy-notifications/channels/types'
import { VendorApprovedEmail } from '@/emails/vendor-approved'

import { getUserEmail } from './recipients'

/**
 * Notify the vendor that their store was approved.
 */
export async function sendVendorApprovedEmail(storeId: string): Promise<DeliveryResult> {
  if (!isEmailConfigured()) return { delivered: false, reason: 'not_configured' }

  try {
    const service = createServiceClient()

    const { data: store, error: storeError } = await service
      .from('store')
      .select('id, name')
      .eq('id', storeId)
      .maybeSingle()

    if (storeError) throw storeError
    if (!store) return { delivered: false, reason: 'store_not_found' }

    const { data: user } = await service
      .from('user')
      .select('full_name')
      .eq('id', storeId)
      .maybeSingle()

    const email = await getUserEmail(storeId)
    if (!email) return { delivered: false, reason: 'no_recipient' }

    return sendEmail({
      to: email,
      subject: `Tu tienda ${store.name} fue aprobada`,
      react: emailElement(VendorApprovedEmail, {
        vendorName: user?.full_name?.trim() || 'Vendedor',
        storeName: store.name,
        dashboardUrl: absoluteUrl(VENDOR_DASHBOARD_PATH),
      }),
    })
  } catch (err) {
    console.error(
      '[email] sendVendorApprovedEmail failed:',
      err instanceof Error ? err.message : err,
    )
    return { delivered: false, reason: err instanceof Error ? err.message : 'unknown' }
  }
}
