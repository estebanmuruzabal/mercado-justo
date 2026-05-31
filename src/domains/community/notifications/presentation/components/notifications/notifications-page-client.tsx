'use client'

import { useMemo } from 'react'
import { Bell, Wifi, WifiOff } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { useNotificationsList } from '@/domains/community/notifications/presentation/hooks/notifications/use-unread-notifications'
import { useNotificationsRealtime } from '@/domains/community/notifications/presentation/hooks/notifications/use-notifications-realtime'

import { NotificationCard } from './notification-card'

export function NotificationsPageClient({
  audience,
  title,
  description,
}: {
  audience: 'buyer' | 'vendor'
  title: string
  description: string
}) {
  const notifications = useNotificationsList(audience)
  const { markAsRead, markAllAsRead, connectionStatus, isLoading } = useNotificationsRealtime()

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.readState === 'unread').length,
    [notifications],
  )

  const statusLabel =
    connectionStatus === 'connected'
      ? 'En vivo'
      : connectionStatus === 'reconnecting'
        ? 'Reconectando…'
        : connectionStatus === 'loading'
          ? 'Conectando…'
          : connectionStatus === 'disconnected'
            ? 'Sin conexión'
            : null

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl'>{title}</h1>
            {statusLabel ? (
              <span className='inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600'>
                {connectionStatus === 'disconnected' ? (
                  <WifiOff className='h-3 w-3' aria-hidden='true' />
                ) : (
                  <Wifi className='h-3 w-3' aria-hidden='true' />
                )}
                {statusLabel}
              </span>
            ) : null}
          </div>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        {unreadCount > 0 ? (
          <Button
            type='button'
            variant='outline'
            className='shrink-0 rounded-full'
            onClick={() => void markAllAsRead(audience)}
          >
            Marcar todas como leídas
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <p className='text-sm text-neutral-500'>Cargando notificaciones…</p>
      ) : notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <ul className='space-y-3'>
          {notifications.map((n) => (
            <li key={n.id}>
              <NotificationCard
                notification={n}
                onMarkRead={(id) => void markAsRead(id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EmptyNotifications() {
  return (
    <div className='rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center'>
      <span className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white'>
        <Bell className='h-5 w-5 text-neutral-500' />
      </span>
      <p className='text-sm font-medium text-neutral-900'>No tenés notificaciones todavía.</p>
      <p className='mt-2 text-sm text-neutral-600'>
        Cuando haya novedades sobre tus pedidos o tu tienda, aparecerán acá en tiempo real.
      </p>
    </div>
  )
}
