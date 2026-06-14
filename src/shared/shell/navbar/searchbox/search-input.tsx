'use client'

import { Search } from 'lucide-react'
import { useUserLocation } from '@/shared/maps/location/presentation/hooks/use-user-location'

export function SearchInput() {
  const { selectedCity } = useUserLocation()

  return (
    <div className='rounded-xl border border-neutral-200 bg-white px-4 py-4'>
      <div className='flex items-center gap-3'>
        <Search className='h-5 w-5 text-neutral-700' aria-hidden='true' />
        <input
          readOnly
          value={selectedCity ?? ''}
          placeholder='Tu ciudad'
          className='w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none'
          aria-label='Tu ciudad'
        />
      </div>
    </div>
  )
}

