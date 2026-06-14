'use client'

import { motion } from 'framer-motion'

import { useMarketplaceFiltersStore } from '@/domains/marketplace/listings/presentation/stores/useMarketplaceFiltersStore'

const RADII = [5, 10, 15, 25, 50] as const

export function RadiusFilter({ compact = false }: { compact?: boolean }) {
  const radiusKm = useMarketplaceFiltersStore((s) => s.radiusKm)
  const setRadiusKm = useMarketplaceFiltersStore((s) => s.setRadiusKm)

  return (
    <div className={compact ? 'min-w-0' : 'w-full'}>
      {!compact ? <div className='text-xs font-semibold text-neutral-700'>Radio</div> : null}
      <div
        role='radiogroup'
        aria-label='Radio de búsqueda'
        className={`${compact ? 'mt-0' : 'mt-2'} flex overflow-hidden rounded-full border border-neutral-200 bg-white p-0.5`}
      >
        {RADII.map((r) => {
          const active = r === radiusKm
          return (
            <motion.button
              key={r}
              type='button'
              role='radio'
              aria-checked={active}
              onClick={() => setRadiusKm(r)}
              whileTap={{ scale: 0.98 }}
              className={
                active
                  ? 'flex-1 rounded-full bg-neutral-900 px-2 py-1.5 text-xs font-semibold text-white sm:px-3 sm:text-sm'
                  : 'flex-1 rounded-full px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 sm:px-3 sm:text-sm'
              }
            >
              {r} km
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
