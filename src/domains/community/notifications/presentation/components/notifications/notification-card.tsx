'use client'

import Link from 'next/link'
import { cn } from '@/shared/utils/utils'
import type { Notification } from '@/shared/events/legacy-notifications/types'
import { formatNotificationTime } from './format-notification-time'

export function NotificationCard({
  notification,
  onMarkRead,
  compact = false,
}: {
  notification: Notification
  onMarkRead?: (id: string) => void
  compact?: boolean
}) {
  const isUnread = notification.readState === 'unread'
  const content = (
    <div
      className={cn(
        'rounded-2xl border transition-colors',
        compact ? 'p-3' : 'p-4',
        isUnread ? 'border-[#FF385C]/20 bg-[#FF385C]/5' : 'border-neutral-200 bg-white',
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold text-neutral-900'>{notification.title}</p>
          <p className='mt-1 text-sm text-neutral-600'>{notification.body}</p>
        </div>
        {isUnread ? (
          <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-[#FF385C]' aria-hidden='true' />
        ) : null}
      </div>
      <p className='mt-2 text-xs text-neutral-500'>{formatNotificationTime(notification.createdAt)}</p>
    </div>
  )

  if (notification.href) {
    return (
      <Link
        href={notification.href}
        className='block hover:opacity-90'
        onClick={() => onMarkRead?.(notification.id)}
      >
        {content}
      </Link>
    )
  }

  return content
}
