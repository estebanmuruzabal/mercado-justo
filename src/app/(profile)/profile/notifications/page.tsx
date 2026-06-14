import Link from 'next/link'

import { NotificationsPageClient } from '@/domains/community/notifications/presentation/components/notifications/notifications-page-client'
import { PROFILE_PATH } from '@/shared/routing/routes'

export default function ProfileNotificationsPage() {
  return (
    <main className='min-h-screen bg-background px-6 py-10'>
      <div className='mx-auto max-w-3xl space-y-6'>
        <Link href={PROFILE_PATH} className='text-sm text-muted-foreground hover:text-foreground'>
          ← Volver al perfil
        </Link>
        <NotificationsPageClient
          audience='buyer'
          title='Notificaciones'
          description='Estado de pedidos, promociones, mensajes y alertas.'
        />
      </div>
    </main>
  )
}
