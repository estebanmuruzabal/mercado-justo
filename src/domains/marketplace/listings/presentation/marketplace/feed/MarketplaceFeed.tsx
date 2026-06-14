'use client'

import { useEffect, useRef, useState } from 'react'

import { useMarketplaceFiltersStore } from '@/domains/marketplace/listings/presentation/stores/useMarketplaceFiltersStore'
import type { MarketplaceListingWithDistance } from '@/domains/marketplace/listings/domain/marketplace'

import { MarketplaceFeedCard } from './MarketplaceFeedCard'

const PAGE_SIZE = 12

export function MarketplaceFeed({
  listings,
  selectedId,
  onSelect,
  horizontal = false,
}: {
  listings: MarketplaceListingWithDistance[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  horizontal?: boolean
}) {
  const resetFilters = useMarketplaceFiltersStore((s) => s.resetFilters)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [listings])

  useEffect(() => {
    if (horizontal) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, listings.length))
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [horizontal, listings.length])

  if (listings.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center'>
        <p className='text-lg font-semibold text-neutral-900'>No hay resultados cerca</p>
        <p className='mt-2 max-w-sm text-sm text-neutral-600'>
          Probá ampliar el radio, cambiar filtros o activar tu ubicación.
        </p>
        <button
          type='button'
          onClick={() => resetFilters()}
          className='mt-4 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white'
        >
          Limpiar filtros
        </button>
      </div>
    )
  }

  const visible = horizontal ? listings : listings.slice(0, visibleCount)

  return (
    <div
      className={
        horizontal
          ? 'flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin'
          : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      {visible.map((listing) => (
        <MarketplaceFeedCard
          key={listing.id}
          listing={listing}
          selected={selectedId === listing.id}
          onSelect={() => onSelect?.(listing.id)}
          compact={horizontal}
        />
      ))}
      {!horizontal && visibleCount < listings.length ? <div ref={sentinelRef} className='h-4' /> : null}
    </div>
  )
}
