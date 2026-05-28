import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { VendorBreadcrumbs } from '@/components/vendor-dashboard/VendorBreadcrumbs'
import { NotificationsPageClient } from '@/components/notifications/notifications-page-client'
import { getStoreByUserId } from '@/server/services/store.service'

export default async function VendorNotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  const store = await getStoreByUserId(user.id)

  return (
    <main className='min-h-screen px-6 py-10'>
      <div className='mx-auto max-w-3xl space-y-6'>
        <VendorBreadcrumbs current='Notificaciones' />

        {!store ? (
          <div className='space-y-6'>
            <div className='space-y-2'>
              <h1 className='text-3xl font-bold'>Activá modo vendedor</h1>
              <p className='text-muted-foreground'>
                Necesitás una tienda activa para recibir notificaciones de ventas.
              </p>
            </div>
            <Link href='/dashboard-vendor/seller' className='text-sm text-muted-foreground hover:text-foreground'>
              ← Volver al modo vendedor
            </Link>
          </div>
        ) : (
          <NotificationsPageClient
            audience='vendor'
            title='Notificaciones'
            description='Ventas, pedidos, listings y novedades de tu tienda.'
          />
        )}
      </div>
    </main>
  )
}
