'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useUserLocation } from '@/shared/maps/location/presentation/hooks/use-user-location'

const RADII = [5, 10, 15] as const
type RadiusKm = (typeof RADII)[number]

export function RadiusSelector() {
  const { radiusKm, setRadiusKm } = useUserLocation()

  const current = useMemo<RadiusKm>(() => {
    if (RADII.includes(radiusKm as RadiusKm)) return radiusKm as RadiusKm
    return 10
  }, [radiusKm])

  return (
    <div className='w-full'>
      <div className='text-sm font-semibold text-neutral-900'>Radio</div>
      <div role='radiogroup' aria-label='Radio de búsqueda' className='mt-3 rounded-2xl border border-neutral-200 bg-white p-1'>
        <div className='flex overflow-hidden rounded-xl'>
          {RADII.map((r, idx) => {
            const active = r === current
            return (
              <motion.button
                key={r}
                type='button'
                role='radio'
                aria-checked={active}
                onClick={() => setRadiusKm(r)}
                whileHover={{ y: -1 }}
                transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.8 }}
                className={
                  active
                    ? `flex-1 bg-neutral-900 px-0.5 py-3 text-sm font-semibold text-white ${idx === 0 ? 'rounded-l-xl' : ''} ${
                        idx === RADII.length - 1 ? 'rounded-r-xl' : ''
                      }`
                    : `flex-1 bg-transparent px-0.5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 ${idx === 0 ? 'rounded-l-xl' : ''} ${
                        idx === RADII.length - 1 ? 'rounded-r-xl' : ''
                      }`
                }
              >
                {r} km
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

