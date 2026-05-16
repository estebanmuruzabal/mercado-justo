'use client'

import { useMemo, useState } from 'react'

import { ListingCard } from './listing-card'

import type { ListingType } from '@/lib/listing'

type BaseListing = {
  id: string
  listingType: ListingType
  title: string
  subtitle: string
  image: string
}

export type ProductListing = BaseListing & {
  listingType: 'product'
  hasOptions: boolean
  price: number
  priceSecondary?: string
}

export type OtherListing = BaseListing & {
  listingType: Exclude<ListingType, 'product'>
  // You can extend these with more fields later.
}

export type Listing = ProductListing | OtherListing

type Props = {
  title: string
  listings: Listing[]
}

export function ListingSection({ title, listings }: Props) {
  const [cartQty, setCartQty] = useState<Record<string, number>>({})
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})

  const favoritesSet = useMemo(() => new Set(Object.keys(favorites).filter((k) => favorites[k])), [favorites])

  function getQty(id: string) {
    return cartQty[id] ?? 0
  }

  function setQty(id: string, next: number) {
    setCartQty((current) => {
      if (next <= 0) {
        const copy = { ...current }
        delete copy[id]
        return copy
      }
      return { ...current, [id]: next }
    })
  }

  return (
    <section>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='text-3xl font-bold tracking-tight'>{title}</h2>

        <button className='text-sm text-muted-foreground hover:text-black'>View all</button>
      </div>

      <div className='flex gap-6 overflow-x-auto pb-2'>
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            quantity={listing.listingType === 'product' ? getQty(listing.id) : undefined}
            isFavorite={favoritesSet.has(listing.id)}
            onToggleFavorite={() => {
              setFavorites((current) => ({ ...current, [listing.id]: !favoritesSet.has(listing.id) }))
            }}
            onAdd={() => listing.listingType === 'product' && setQty(listing.id, getQty(listing.id) + 1)}
            onMinus={() => listing.listingType === 'product' && setQty(listing.id, getQty(listing.id) - 1)}
            onPlus={() => listing.listingType === 'product' && setQty(listing.id, getQty(listing.id) + 1)}
            onOpenOptions={() => {
              // Modal/drawer is intentionally not implemented yet.
              // This callback is where you'd open it later.
              // Placeholder for future options modal.
            }}
          />
        ))}
      </div>
    </section>
  )
}