'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { allNotificationsPath } from '@/shared/routing/routes'
import { useNotificationsList } from '@/domains/community/notifications/presentation/hooks/notifications/use-unread-notifications'
import { NotificationCard } from '@/domains/community/notifications/presentation/components/notifications/notification-card'
import { useNotificationsRealtime } from '@/domains/community/notifications/presentation/hooks/notifications/use-notifications-realtime'

const PREVIEW_LIMIT = 5

export function NotificationsPanel({
  isSeller,
  onClose,
}: {
  isSeller: boolean
  onClose: () => void
}) {
  const audience = isSeller ? 'vendor' : 'buyer'
  const items = useNotificationsList(audience, PREVIEW_LIMIT)
  const { markAsRead, isLoading } = useNotificationsRealtime()
  const allNotificationsHref = allNotificationsPath(isSeller)

  return (
    <div className='w-[min(100vw-2rem,20rem)] overflow-hidden rounded-2xl bg-white py-2 shadow-[0_4px_20px_rgba(0,0,0,0.12)] sm:w-80'>
      <div className='border-b border-neutral-100 px-5 py-3'>
        <h2 className='text-sm font-semibold text-neutral-900'>Notificaciones</h2>
      </div>

      {isLoading ? (
        <div className='px-5 py-6 text-center text-sm text-neutral-500'>Conectando…</div>
      ) : items.length === 0 ? (
        <div className='px-5 py-8 text-center'>
          <span className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100'>
            <Bell className='h-5 w-5 text-neutral-500' aria-hidden='true' />
          </span>
          <p className='text-sm font-medium text-neutral-900'>No tenés notificaciones todavía.</p>
          <p className='mt-2 text-sm leading-relaxed text-neutral-600'>
            Cuando vendas productos o tengas novedades,
            <br />
            las verás acá.
          </p>
        </div>
      ) : (
        <ul className='max-h-[min(60vh,320px)] overflow-y-auto overscroll-contain px-3 py-2'>
          <AnimatePresence initial={false}>
            {items.map((notification) => (
              <motion.li
                key={notification.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className='py-1'
              >
                <NotificationCard
                  notification={notification}
                  compact
                  onMarkRead={(id) => void markAsRead(id)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <div className='border-t border-neutral-100 px-5 py-3'>
        <Button
          asChild
          variant='secondary'
          className='w-full rounded-full'
          onClick={onClose}
        >
          <Link href={allNotificationsHref}>Ver todas las notificaciones</Link>
        </Button>
      </div>
    </div>
  )
}
