import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getStoreByUserId } from '@/server/services/store.service'

import { VendorBreadcrumbs } from '@/components/vendor-dashboard/VendorBreadcrumbs'
import { VendorSellerProfileClient } from '@/components/vendor-dashboard/vendor-seller/vendor-seller-profile-client'

export default async function VendorSellerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  const store = await getStoreByUserId(user.id)

  return (
    <main className='min-h-screen px-6 py-10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <VendorBreadcrumbs current='Seller Profile' />
        <VendorSellerProfileClient initialStore={store} />
      </div>
    </main>
  )
}

