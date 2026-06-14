'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import { useMapListings } from '@/domains/marketplace/listings/presentation/hooks/use-marketplace-listings'
import { useUserCoordinates } from '@/shared/maps/location/presentation/stores/useUserLocationStore'
import type { MarketplaceListingWithDistance } from '@/domains/marketplace/listings/domain/marketplace'

import { MarketplaceFeed } from '../feed/MarketplaceFeed'
import { MarketplaceMap } from '../map/MarketplaceMap'

export function MarketplaceHybridLayout({
  listings,
}: {
  listings: MarketplaceListingWithDistance[]
}) {
  const userCoords = useUserCoordinates()
  const mapListings = useMapListings(listings)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mapExpanded, setMapExpanded] = useState(true)

  return (
    <div className='flex h-full flex-col'>
      {/* Mobile: collapsible map */}
      <div className='lg:hidden'>
        <button
          type='button'
          onClick={() => setMapExpanded((v) => !v)}
          className='mb-3 flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold'
        >
          <span>Mapa ({mapListings.length})</span>
          {mapExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
        </button>
        {mapExpanded ? (
          <MarketplaceMap
            listings={mapListings}
            selectedId={selectedId}
            onSelect={setSelectedId}
            userCoords={userCoords}
            className='mb-4 h-[240px] w-full rounded-2xl'
          />
        ) : null}
        <MarketplaceFeed
          listings={listings}
          selectedId={selectedId}
          onSelect={setSelectedId}
          horizontal
        />
      </div>

      {/* Desktop: split layout */}
      <div className='hidden min-h-[calc(100vh-220px)] gap-4 lg:grid lg:grid-cols-[45%_55%]'>
        <MarketplaceMap
          listings={mapListings}
          selectedId={selectedId}
          onSelect={setSelectedId}
          userCoords={userCoords}
          className='sticky top-[180px] h-[calc(100vh-220px)] w-full rounded-2xl'
        />
        <div className='overflow-y-auto pr-2'>
          <p className='mb-4 text-sm text-neutral-600'>
            {listings.length} resultado{listings.length === 1 ? '' : 's'}
          </p>
          <MarketplaceFeed
            listings={listings}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </div>
  )
}
