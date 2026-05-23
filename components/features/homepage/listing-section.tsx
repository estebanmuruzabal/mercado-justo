'use client'

import { useMemo, useState } from 'react'
import { useEffect } from 'react'

import { ListingCard } from './listing-card'

import type { ListingType } from '@/lib/listing'
import { useCartStore } from '@/stores/cart-store/cart-store'
import { createClient } from '@/lib/supabase/client'

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
  storeId: string
  variantId: string
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
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const { items, addItem, setQuantity } = useCartStore()
  const supabase = useMemo(() => createClient(), [])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      setCurrentUserId(data.user?.id ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [supabase])

  const favoritesSet = useMemo(() => new Set(Object.keys(favorites).filter((k) => favorites[k])), [favorites])

  function getQty(variantId: string) {
    const item = items.find((i) => i.listingType === 'product' && i.variantId === variantId)
    return item?.quantity ?? 0
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
            quantity={listing.listingType === 'product' ? getQty(listing.variantId) : undefined}
            isFavorite={favoritesSet.has(listing.id)}
            onToggleFavorite={() => {
              setFavorites((current) => ({ ...current, [listing.id]: !favoritesSet.has(listing.id) }))
            }}
            onAdd={() => {
              if (listing.listingType !== 'product') return
              if (listing.storeId && currentUserId && listing.storeId === currentUserId) return
              const qty = getQty(listing.id)
              if (qty > 0) {
                setQuantity('product', listing.variantId, qty + 1)
              } else {
                addItem({
                  listingType: 'product',
                  variantId: listing.variantId,
                  title: listing.title,
                  image: listing.image,
                  storeId: listing.storeId,
                  quantity: 1,
                  unitPrice: listing.price,
                })
              }
            }}
            onMinus={() => {
              if (listing.listingType !== 'product') return
              if (listing.storeId && currentUserId && listing.storeId === currentUserId) return
              const qty = getQty(listing.variantId)
              setQuantity('product', listing.variantId, qty - 1)
            }}
            onPlus={() => {
              if (listing.listingType !== 'product') return
              if (listing.storeId && currentUserId && listing.storeId === currentUserId) return
              const qty = getQty(listing.variantId)
              setQuantity('product', listing.variantId, qty + 1)
            }}
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