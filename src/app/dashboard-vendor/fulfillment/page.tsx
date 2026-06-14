import { redirect } from 'next/navigation'

import { VendorBreadcrumbs } from '@/domains/vendors/presentation/dashboard/VendorBreadcrumbs'
import { VendorFulfillmentHubClient } from '@/domains/vendors/presentation/dashboard/fulfillment/vendor-fulfillment-hub-client'
import { getVendorFulfillmentConfiguration } from '@/domains/vendors/application/queries/vendor-fulfillment.queries'
import { BECOME_VENDOR_PATH, SIGN_IN_PATH } from '@/shared/routing/routes'
import { createClient } from '@/shared/database/supabase/server'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'

export default async function VendorFulfillmentPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(SIGN_IN_PATH)

  const store = await getStoreByUserId(user.id)
  if (!store) redirect(BECOME_VENDOR_PATH)

  const configuration = await getVendorFulfillmentConfiguration(user.id)
  if (!configuration) redirect(BECOME_VENDOR_PATH)

  return (
    <main className='min-h-screen px-6 py-10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <VendorBreadcrumbs current='Fulfillment' />
        <VendorFulfillmentHubClient configuration={configuration} />
      </div>
    </main>
  )
}
