'use client'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useUserLocation } from '@/hooks/use-user-location'
import type { SearchPayload, TabId } from '../right/airbnbTabs'

export function SearchBottomBar({
  activeTab,
  onSearch,
  onClose,
}: {
  activeTab: TabId
  onSearch: (payload: SearchPayload) => void
  onClose: () => void
}) {
  const { setCity, setRadiusKm, radiusKm, selectedCity } = useUserLocation()

  return (
    <div
      className='mt-auto border-t border-neutral-200 bg-white/95 backdrop-blur-sm px-5 py-4'
      style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
    >
      <div className='flex items-center justify-between'>
        <button
          type='button'
          onClick={() => {
            setCity(null)
            setRadiusKm(10)
          }}
          className='text-sm font-semibold underline text-neutral-900'
        >
          Borrar todo
        </button>

        <motion.button
          type='button'
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.8 }}
          onClick={() => {
            onSearch({
              tab: activeTab,
              place: selectedCity ?? '',
              dates: `${radiusKm} km`,
              guests: '',
            })
            onClose()
          }}
          className='flex items-center gap-2 rounded-full bg-[#FF385C] px-6 py-3 text-white shadow-[0_12px_30px_rgba(255,56,92,0.25)]'
        >
          <Search className='h-4 w-4' />
          <span className='text-sm font-semibold'>Buscar</span>
        </motion.button>
      </div>
    </div>
  )
}

