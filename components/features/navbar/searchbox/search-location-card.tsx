'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { SearchInput } from './search-input'
import { CitySelector } from './city-selector'
import { useUserLocation } from '@/hooks/use-user-location'

export function SearchLocationCard() {
  const { status } = useUserLocation()

  return (
    <motion.section
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
      className='rounded-3xl bg-white p-6 shadow-sm'
    >
      <h2 className='text-2xl font-bold text-neutral-900'>¿Dónde?</h2>

      <div className='mt-5'>
        <SearchInput />
      </div>

      <div className='mt-4'>
        <div className='mb-3 text-sm font-semibold text-neutral-900'>Sugerencias de destinos</div>
        <CitySelector variant='modal' />

        <AnimatePresence>
          {status === 'requesting' ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
              className='mt-3 text-xs text-neutral-500'
            >
              Obteniendo ubicación...
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}

