'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { useMapListings, useMarketplaceListings } from '@/hooks/use-marketplace-listings'
import type { ListingType } from '@/lib/listing'
import { useMarketplaceViewStore } from '@/stores/useMarketplaceViewStore'
import type { MarketplaceListing } from '@/types/marketplace'
import { useEffect, useState } from 'react'

import { useMarketplaceCategoriesStore } from '@/stores/useMarketplaceCategoriesStore'

import { MarketplaceFeed } from './feed/MarketplaceFeed'
import { MarketplaceHybridLayout } from './hybrid/MarketplaceHybridLayout'
import { MarketplaceMap } from './map/MarketplaceMap'
import { LocationPrompt } from './search/LocationPrompt'
import { useUserCoordinates } from '@/stores/useUserLocationStore'

type CategoryOption = {
  id: string
  name: string
  listingType: ListingType
}

export function MarketplaceBrowseClient({
  initialListings,
  categories,
}: {
  initialListings: MarketplaceListing[]
  categories: CategoryOption[]
}) {
  const setCategories = useMarketplaceCategoriesStore((s) => s.setCategories)

  useEffect(() => {
    setCategories(categories)
  }, [categories, setCategories])

  const viewMode = useMarketplaceViewStore((s) => s.viewMode)
  const listings = useMarketplaceListings(initialListings)
  const mapListings = useMapListings(listings)
  const userCoords = useUserCoordinates()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <main className='min-h-screen bg-background'>
      <LocationPrompt />

      <div className='px-4 pb-20 pt-4 md:px-8'>
        <div className='mb-4 flex items-center justify-between'>
          <h1 className='text-xl font-semibold tracking-tight md:text-2xl'>
            Cerca de vos
          </h1>
          <p className='text-sm text-neutral-600'>
            {listings.length} resultado{listings.length === 1 ? '' : 's'}
          </p>
        </div>

        <AnimatePresence mode='wait'>
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'list' ? (
              <MarketplaceFeed listings={listings} />
            ) : null}

            {viewMode === 'map' ? (
              <MarketplaceMap
                listings={mapListings}
                selectedId={selectedId}
                onSelect={setSelectedId}
                userCoords={userCoords}
                className='h-[calc(100vh-240px)] min-h-[480px] w-full rounded-2xl'
              />
            ) : null}

            {viewMode === 'hybrid' ? <MarketplaceHybridLayout listings={listings} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}
