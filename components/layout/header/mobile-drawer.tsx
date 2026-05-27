'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { UserMenu } from '@/components/features/navbar/right/UserMenu'
import { drawerVariants, overlayVariants } from '@/lib/motion/navbar-motion'
import { springSoft } from '@/lib/motion/transitions'

export function MobileDrawer({
  open,
  onClose,
  onMenuAction,
}: {
  open: boolean
  onClose: () => void
  onMenuAction?: (action: string) => void
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className='fixed inset-0 z-50'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          {/* Overlay */}
          <motion.div
            className='absolute inset-0 bg-black/30 backdrop-blur-sm'
            onClick={onClose}
            variants={overlayVariants}
            initial='closed'
            animate='open'
            exit='closed'
          />

          {/* Drawer (RIGHT) */}
          <motion.aside
            role='dialog'
            aria-modal='true'
            variants={drawerVariants}
            initial='closed'
            animate='open'
            exit='closed'
            transition={springSoft}
            className='absolute right-0 top-0 h-full w-80 border-l border-neutral-200 bg-white/95 backdrop-blur-md'
          >
            <div className='flex items-center justify-between px-4 pt-4'>
              <span className='text-sm font-semibold text-neutral-900'>Menú</span>
              <motion.button
                type='button'
                onClick={onClose}
                aria-label='Cerrar menú'
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100'
              >
                <X className='h-4 w-4 text-neutral-900' />
              </motion.button>
            </div>

            <div className='px-4 py-4'>
              <UserMenu onClose={onClose} onAction={(a) => onMenuAction?.(a)} />
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

