'use client'

import { motion } from 'framer-motion'
import type { TabId } from '@/components/features/navbar/right/airbnbTabs'

export type HeaderTab = { id: TabId; label: string; emoji: string; isNew?: boolean }

export function NavItem({
  tab,
  active,
  onSelect,
  orientation = 'horizontal',
}: {
  tab: HeaderTab
  active: boolean
  onSelect: () => void
  orientation?: 'horizontal' | 'vertical'
}) {
  return (
    <motion.button
      type='button'
      onClick={onSelect}
      className={
        orientation === 'horizontal'
          ? 'relative flex items-center gap-2 px-4 py-2 text-base transition-colors'
          : 'flex flex-col items-center gap-1 px-1'
      }
      aria-current={active ? 'page' : undefined}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.9 }}
    >
      <span className={orientation === 'horizontal' ? 'relative text-2xl' : 'text-3xl leading-none'}>
        <span aria-hidden='true'>{tab.emoji}</span>
        {tab.isNew ? (
          <span
            className={
              orientation === 'horizontal'
                ? 'absolute -right-8 -top-2 rounded-md bg-[#2B3A55] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white'
                : 'absolute -right-5 -top-1 rounded-full bg-[#2B3A55] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white'
            }
          >
            Proximamente
          </span>
        ) : null}
      </span>

      <span
        className={
          orientation === 'horizontal'
            ? active
              ? 'font-semibold text-neutral-900'
              : 'font-medium text-neutral-500'
            : active
              ? 'text-xs font-semibold text-neutral-900 border-b-2 border-neutral-900 pb-0.5'
              : 'text-xs text-neutral-500'
        }
      >
        {tab.label}
      </span>

      {orientation === 'horizontal' ? (
        <motion.span
          aria-hidden='true'
          className='absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-neutral-900'
          animate={{ scaleX: active ? 1 : 0, opacity: active ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
          style={{ transformOrigin: 'center' }}
        />
      ) : null}
    </motion.button>
  )
}

