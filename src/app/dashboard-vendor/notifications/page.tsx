import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/shared/database/supabase/server'
import { VendorBreadcrumbs } from '@/domains/vendors/presentation/dashboard/VendorBreadcrumbs'
import { NotificationsPageClient } from '@/domains/community/notifications/presentation/components/notifications/notifications-page-client'
import { TelegramNotificationsCard } from '@/domains/vendors/presentation/dashboard/telegram/telegram-notifications-card'
import { BECOME_VENDOR_PATH, SIGN_IN_PATH } from '@/shared/routing/routes'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'
import { getVendorTelegramSettings } from '@/domains/dittobots/application/queries/telegram.queries'
import { isTelegramConfigured } from '@/shared/telegram/telegram/config'

export default async function VendorNotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(SIGN_IN_PATH)

  const store = await getStoreByUserId(user.id)
  const telegramSettings = store ? await getVendorTelegramSettings(supabase, user.id) : null

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
            <Link href={BECOME_VENDOR_PATH} className='text-sm text-muted-foreground hover:text-foreground'>
              ← Activar modo vendedor
            </Link>
          </div>
        ) : (
          <>
            {telegramSettings && (
              <TelegramNotificationsCard
                initialSettings={telegramSettings}
                configured={isTelegramConfigured()}
              />
            )}
            <NotificationsPageClient
              audience='vendor'
              title='Notificaciones'
              description='Ventas, pedidos, listings y novedades de tu tienda.'
            />
          </>
        )}
      </div>
    </main>
  )
}
