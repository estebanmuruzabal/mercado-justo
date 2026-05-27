'use client'

import { motion } from 'framer-motion'

type AnchorRect = { top: number; left: number; width: number; height: number }

export function LocationOnboardingPopover({
  open,
  anchorRect,
  onUnderstood,
}: {
  open: boolean
  anchorRect: AnchorRect | null
  onUnderstood: () => void
}) {
  if (!open || !anchorRect) return null

  const left = anchorRect.left + anchorRect.width / 2
  const top = anchorRect.top + anchorRect.height + 12

  return (
    <motion.div
      role='dialog'
      aria-modal='false'
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
      style={{
        position: 'fixed',
        zIndex: 60,
        top,
        left,
        transform: 'translateX(-50%)',
      }}
      className='w-[min(520px,calc(100vw-2rem))] rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.12)] ring-1 ring-neutral-100'
    >
      <div className='space-y-3'>
        <div className='text-2xl font-bold text-neutral-900'>Completa los detalles de tu ubicación</div>
        <div className='text-sm leading-relaxed text-neutral-500'>
          Descubre locales cerca de ti, promociones y mucho más.
        </div>
      </div>

      <div className='mt-6 flex justify-end'>
        <button
          type='button'
          onClick={onUnderstood}
          className='rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors'
        >
          Entendido
        </button>
      </div>
    </motion.div>
  )
}

