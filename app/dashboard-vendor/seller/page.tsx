import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getStoreByUserId } from '@/server/services/store.service'
import { BECOME_VENDOR_PATH, SIGN_IN_PATH } from '@/lib/routes'

import { VendorBreadcrumbs } from '@/components/vendor-dashboard/VendorBreadcrumbs'
import { VendorSellerInformationClient } from '@/components/vendor-dashboard/vendor-seller/vendor-seller-information-client'

export default async function VendorSellerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(SIGN_IN_PATH)

  const store = await getStoreByUserId(user.id)
  if (!store) {
    redirect(BECOME_VENDOR_PATH)
  }

  return (
    <main className='min-h-screen px-6 py-10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <VendorBreadcrumbs current='Información del vendedor' />
        <VendorSellerInformationClient initialStore={store} />
      </div>
    </main>
  )
}
