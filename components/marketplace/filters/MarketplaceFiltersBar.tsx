'use client'

import { Search } from 'lucide-react'
import { useEffect, useState, type FocusEvent, type MouseEvent } from 'react'

import { useRequireReceiveMode } from '@/hooks/location/use-require-receive-mode'
import { useMarketplaceCategoriesStore } from '@/stores/useMarketplaceCategoriesStore'
import { useMarketplaceFiltersStore } from '@/stores/useMarketplaceFiltersStore'
import { useUserLocationStore } from '@/stores/useUserLocationStore'

import { CategoryFilter } from './CategoryFilter'
import { DeliveryPickupFilter } from './DeliveryPickupFilter'
import { ListingTypeFilter } from './ListingTypeFilter'
import { RadiusFilter } from './RadiusFilter'
import { ViewModeToggle } from './ViewModeToggle'

export function MarketplaceFiltersBar({
  layout = 'desktop',
}: {
  layout?: 'desktop' | 'mobile' | 'collapsed'
}) {
  const categories = useMarketplaceCategoriesStore((s) => s.categories)
  const searchQuery = useMarketplaceFiltersStore((s) => s.searchQuery)
  const setSearchQuery = useMarketplaceFiltersStore((s) => s.setSearchQuery)
  const radiusKm = useMarketplaceFiltersStore((s) => s.radiusKm)
  const latitude = useUserLocationStore((s) => s.latitude)
  const requestLocation = useUserLocationStore((s) => s.requestLocation)
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const { hasReceiveMode, guardReceiveMode, promptReceiveMode } = useRequireReceiveMode()

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(localQuery), 250)
    return () => window.clearTimeout(timer)
  }, [localQuery, setSearchQuery])

  const blockSearchInteraction = (e: FocusEvent<HTMLInputElement> | MouseEvent) => {
    if (hasReceiveMode) return
    e.preventDefault()
    if (e.currentTarget instanceof HTMLInputElement) {
      e.currentTarget.blur()
    }
    promptReceiveMode()
  }

  const handleSearchChange = (value: string) => {
    guardReceiveMode(() => setLocalQuery(value))
  }

  if (layout === 'collapsed') {
    const collapsedContent = (
      <>
        <span className='font-medium text-neutral-900'>
          {latitude !== null ? `Radio ${radiusKm} km` : 'Sin ubicación'}
        </span>
        <span className='h-4 w-px bg-neutral-200' />
        <span className='truncate text-neutral-500'>{searchQuery || 'Buscar productos'}</span>
      </>
    )

    if (!hasReceiveMode) {
      return (
        <button
          type='button'
          onClick={promptReceiveMode}
          className='flex w-full items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow'
        >
          {collapsedContent}
        </button>
      )
    }

    return (
      <div className='flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm'>
        {collapsedContent}
      </div>
    )
  }

  if (layout === 'mobile') {
    return (
      <div className='space-y-4 p-4'>
        <div>
          <label htmlFor='marketplace-search-mobile' className='text-xs font-semibold text-neutral-700'>
            Buscar
          </label>
          <div className='relative mt-2'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400' />
            <input
              id='marketplace-search-mobile'
              type='search'
              value={localQuery}
              readOnly={!hasReceiveMode}
              onFocus={blockSearchInteraction}
              onMouseDown={blockSearchInteraction}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder='Productos, vendedores...'
              className='w-full rounded-full border border-neutral-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-neutral-400'
            />
          </div>
        </div>
        <ListingTypeFilter />
        <CategoryFilter categories={categories} />
        <RadiusFilter />
        <ViewModeToggle />
        <DeliveryPickupFilter />
        {latitude === null ? (
          <button
            type='button'
            onClick={() => requestLocation()}
            className='w-full rounded-full bg-[#FF385C] py-2.5 text-sm font-semibold text-white'
          >
            Activar ubicación
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-6xl rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-end'>
        <div className='flex-1'>
          <label htmlFor='marketplace-search' className='text-xs font-semibold text-neutral-700'>
            Buscar
          </label>
          <div className='relative mt-2'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400' />
            <input
              id='marketplace-search'
              type='search'
              value={localQuery}
              readOnly={!hasReceiveMode}
              onFocus={blockSearchInteraction}
              onMouseDown={blockSearchInteraction}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder='Productos, vendedores, categorías...'
              className='w-full rounded-full border border-neutral-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-neutral-400'
            />
          </div>
        </div>
        <div className='grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          <ListingTypeFilter compact />
          <RadiusFilter compact />
          <ViewModeToggle compact />
        </div>
      </div>
      <div className='mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-start sm:justify-between'>
        <CategoryFilter categories={categories} compact />
        <DeliveryPickupFilter />
      </div>
    </div>
  )
}
