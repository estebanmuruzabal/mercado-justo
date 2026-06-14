'use client'

import { motion } from 'framer-motion'
import type { TabId, SearchPayload } from '../right/airbnbTabs'
import { SearchTabs } from './search-tabs'
import { SearchLocationCard } from './search-location-card'
import { RadiusSelector } from './radius-selector'
import { SearchBottomBar } from './search-bottom-bar'

export function SearchModalMobile({
  activeTab,
  onSelectTab,
  onClose,
  onSearch,
}: {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  onClose: () => void
  onSearch: (payload: SearchPayload) => void
}) {
  return (
    <motion.div
      className='fixed inset-0 z-50 flex flex-col bg-neutral-100'
      role='dialog'
      aria-modal='true'
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
    >
      <div className='flex items-center justify-between px-4 pt-4'>
        <div className='flex-1'>
          <SearchTabs activeTab={activeTab} onSelectTab={onSelectTab} />
        </div>
        <motion.button
          type='button'
          onClick={onClose}
          aria-label='Cerrar'
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className='ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100'
        >
          <span aria-hidden='true' className='text-neutral-900 text-xl leading-none'>
            ×
          </span>
        </motion.button>
      </div>

      <div className='flex-1 overflow-y-auto px-4 py-4'>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
          className='space-y-4'
        >
          <SearchLocationCard />
          <RadiusSelector />
        </motion.div>
      </div>

      <SearchBottomBar activeTab={activeTab} onSearch={onSearch} onClose={onClose} />
    </motion.div>
  )
}

