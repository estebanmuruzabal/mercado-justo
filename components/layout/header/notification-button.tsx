'use client'

import { Bell } from 'lucide-react'
import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'

import { cn } from '@/lib/utils'

export function NotificationButton({
  unreadCount,
  showBadge,
  onClick,
  className,
  isActive,
  bellPulseToken = 0,
}: {
  unreadCount: number
  showBadge: boolean
  onClick: () => void
  className?: string
  isActive?: boolean
  bellPulseToken?: number
}) {
  const controls = useAnimation()

  useEffect(() => {
    if (bellPulseToken <= 0) return
    void controls.start({
      rotate: [0, -14, 14, -8, 8, 0],
      scale: [1, 1.08, 1],
      transition: { duration: 0.55, ease: 'easeOut' },
    })
  }, [bellPulseToken, controls])

  return (
    <motion.button
      type='button'
      onClick={onClick}
      aria-label='Notificaciones'
      aria-expanded={isActive}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 transition-colors hover:bg-neutral-200',
        isActive && 'bg-neutral-200 ring-2 ring-[#FF385C]/20',
        className,
      )}
    >
      <motion.span animate={controls} className='inline-flex'>
        <Bell className='h-4 w-4' aria-hidden='true' />
      </motion.span>
      {showBadge && unreadCount > 0 ? (
        <motion.span
          key={unreadCount}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className='absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF385C] px-1 text-[10px] font-bold leading-none text-white'
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.span>
      ) : null}
    </motion.button>
  )
}
