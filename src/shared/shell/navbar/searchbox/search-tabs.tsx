'use client'

import { motion } from 'framer-motion'
import type { TabId } from '../right/airbnbTabs'
import { TABS } from '../right/airbnbTabs'

export function SearchTabs({
  activeTab,
  onSelectTab,
}: {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
}) {
  return (
    <div className='mx-auto flex items-center justify-center gap-6 px-4'>
      {TABS.map((t) => {
        const active = t.id === activeTab
        return (
          <button
            key={t.id}
            type='button'
            onClick={() => onSelectTab(t.id)}
            className='group relative flex flex-col items-center gap-2 pb-2'
            aria-current={active ? 'page' : undefined}
          >
            <span className='text-2xl leading-none' aria-hidden='true'>
              {t.emoji}
            </span>
            <span
              className={
                active ? 'text-xs font-semibold text-neutral-900' : 'text-xs font-medium text-neutral-500'
              }
            >
              {t.label}
            </span>

            {active ? (
              <motion.span
                aria-hidden='true'
                layoutId='search-tabs-underline'
                className='absolute -bottom-0.5 h-0.5 w-10 rounded-full bg-neutral-900'
                initial={false}
              />
            ) : (
              <span className='absolute -bottom-0.5 h-0.5 w-10 rounded-full bg-transparent' aria-hidden='true' />
            )}
          </button>
        )
      })}
    </div>
  )
}

