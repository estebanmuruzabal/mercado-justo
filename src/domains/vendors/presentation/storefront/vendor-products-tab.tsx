'use client'

import { useState, useTransition } from 'react'
import { PackageOpen } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { loadVendorListingsAction } from '@/domains/vendors/application/actions/vendor-public.actions'
import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'

import { VendorProductCard, VendorProductCardSkeleton } from './vendor-product-card'

const PAGE_SIZE = 12

export function VendorProductsTab({
  storeId,
  storeName,
  initialListings,
}: {
  storeId: string
  storeName: string
  initialListings: MarketplaceListing[]
}) {
  const [listings, setListings] = useState<MarketplaceListing[]>(initialListings)
  const [hasMore, setHasMore] = useState(initialListings.length >= PAGE_SIZE)
  const [isPending, startTransition] = useTransition()

  function loadMore() {
    startTransition(async () => {
      const next = await loadVendorListingsAction({
        storeId,
        storeName,
        offset: listings.length,
        limit: PAGE_SIZE,
      })
      setListings((prev) => [...prev, ...next])
      setHasMore(next.length >= PAGE_SIZE)
    })
  }

  if (listings.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-16 text-center'>
        <PackageOpen className='h-10 w-10 text-neutral-400' />
        <p className='text-sm text-neutral-500'>Esta tienda todavía no publicó productos.</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4'>
        {listings.map((listing, i) => (
          <VendorProductCard key={listing.id} listing={listing} index={i % PAGE_SIZE} />
        ))}
        {isPending
          ? Array.from({ length: 4 }).map((_, i) => <VendorProductCardSkeleton key={`sk-${i}`} />)
          : null}
      </div>

      {hasMore ? (
        <div className='flex justify-center'>
          <Button variant='outline' onClick={loadMore} disabled={isPending} className='rounded-full'>
            {isPending ? 'Cargando...' : 'Cargar más'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
