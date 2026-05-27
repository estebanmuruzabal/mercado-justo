import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { VendorBreadcrumbs } from '@/components/vendor-dashboard/VendorBreadcrumbs'
import { CategoriesTab } from '@/components/profile/tabs/categories'
import { getStoreByUserId } from '@/server/services/store.service'

export default async function VendorCategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  const store = await getStoreByUserId(user.id)

  return (
    <main className='min-h-screen px-6 py-10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <VendorBreadcrumbs current='Categories' />

        {!store ? (
          <div className='space-y-6'>
            <div className='space-y-2'>
              <h1 className='text-3xl font-bold'>Activá modo vendedor</h1>
              <p className='text-muted-foreground'>Tenés que activar tu tienda para gestionar categorías.</p>
            </div>
            <Link href='/dashboard-vendor/seller' className='text-sm text-muted-foreground hover:text-foreground'>
              ← Volver al modo vendedor
            </Link>
          </div>
        ) : (
          <div className='space-y-2'>
            <h1 className='text-3xl font-bold'>Vendor panel</h1>
            <p className='text-sm text-muted-foreground'>Categorías</p>
            <CategoriesTab />
          </div>
        )}
      </div>
    </main>
  )
}

