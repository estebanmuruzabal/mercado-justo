'use client'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useUserLocation } from '@/hooks/use-user-location'
import type { SearchPayload } from '@/components/features/navbar/right/airbnbTabs'
import { CitySelector } from './city-selector'
import { RadiusSelector } from './radius-selector'

export function SearchBox({
  layout,
  tab,
  onSearch,
}: {
  layout: 'desktop' | 'modal'
  tab: SearchPayload['tab']
  onSearch?: (payload: SearchPayload) => void
}) {
  const { selectedCity, radiusKm } = useUserLocation()

  const payload: SearchPayload = {
    tab,
    place: selectedCity ?? '',
    dates: `${radiusKm} km`,
    guests: '',
  }

  return (
    <div>
      {layout === 'desktop' ? (
        <div className='mx-auto flex max-w-3xl items-center gap-3 rounded-full border border-neutral-200 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]'>
          {/* City */}
          <CitySelector buttonLabel='Tu ciudad' variant='searchbar' />
          {/* Radius */}
          <motion.div
            className='w-40'
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
          >
            <RadiusSelector />
          </motion.div>
          {/* Search */}
          <motion.button
            type='button'
            onClick={() => onSearch?.(payload)}
            aria-label='Buscar'
            className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FF385C] text-white'
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.8 }}
          >
            <Search className='h-5 w-5' />
          </motion.button>
        </div>
      ) : (
        <div className='rounded-3xl bg-white p-5 shadow-sm'>
          <CitySelector buttonLabel='Tu ciudad' />
          <div className='mt-4'>
            <RadiusSelector />
          </div>
        </div>
      )}
    </div>
  )
}

