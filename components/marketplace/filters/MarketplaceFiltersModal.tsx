'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { MarketplaceFiltersBar } from '@/components/marketplace/filters/MarketplaceFiltersBar'

export function MarketplaceFiltersModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 bg-black/40'
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            // Leave room for the sticky header subheader.
            className='fixed inset-x-0 bottom-0 z-50 max-h-[calc(90vh-72px)] overflow-y-auto rounded-t-3xl bg-white shadow-xl'
          >
            <div className='sticky top-0 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3'>
              <h2 className='text-base font-semibold'>Filtros</h2>
              <button
                type='button'
                onClick={onClose}
                className='rounded-full p-2 hover:bg-neutral-100'
                aria-label='Cerrar filtros'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
            <MarketplaceFiltersBar layout='mobile' />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
