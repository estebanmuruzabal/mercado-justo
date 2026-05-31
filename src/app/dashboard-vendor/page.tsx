import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { VendorOverviewClient } from '@/domains/vendors/presentation/dashboard/vendor-overview-client'
import { BECOME_VENDOR_PATH, SIGN_IN_PATH } from '@/shared/routing/routes'
import { createClient } from '@/shared/database/supabase/server'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'

export default async function VendorOverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(SIGN_IN_PATH)

  const store = await getStoreByUserId(user.id)

  if (!store) {
    return (
      <main className='min-h-screen px-6 py-10'>
        <div className='mx-auto max-w-6xl space-y-6'>
          <div className='space-y-2'>
            <h1 className='text-3xl font-bold'>Overview</h1>
            <p className='text-muted-foreground'>
              Activá tu tienda para acceder al panel vendedor.
            </p>
          </div>
          <Link href={BECOME_VENDOR_PATH} className='text-sm text-muted-foreground hover:text-foreground'>
            ← Convertite en vendedor
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen px-6 py-10'>
      <div className='mx-auto max-w-6xl'>
        <Suspense fallback={null}>
          <VendorOverviewClient />
        </Suspense>
      </div>
    </main>
  )
}
