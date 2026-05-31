'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, MapPin, Minus, Plus, Truck, Store } from 'lucide-react'

import { getListingTypeLabel } from '@/domains/marketplace/listings/domain/listing'
import { useCartStore } from '@/domains/marketplace/checkout/presentation/stores/cart-store/cart-store'
import type { MarketplaceListingWithDistance } from '@/domains/marketplace/listings/domain/marketplace'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop'

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export function MarketplaceFeedCard({
  listing,
  isFavorite = false,
  onToggleFavorite,
  selected = false,
  onSelect,
  compact = false,
}: {
  listing: MarketplaceListingWithDistance
  isFavorite?: boolean
  onToggleFavorite?: () => void
  selected?: boolean
  onSelect?: () => void
  compact?: boolean
}) {
  const router = useRouter()
  const { addItem, items, setQuantity } = useCartStore()

  const variantId = listing.variantId ?? listing.id
  const cartItem = items.find(
    (i) => i.listingType === listing.listingType && i.variantId === variantId,
  )
  const quantity = cartItem?.quantity ?? 0

  function navigateToDetail() {
    router.push(`/listing/${listing.listingType}/${listing.id}`)
  }

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (listing.listingType !== 'product' || !listing.variantId) {
      navigateToDetail()
      return
    }
    addItem({
      listingType: 'product',
      variantId: listing.variantId,
      storeId: listing.storeId,
      title: listing.title,
      image: listing.image ?? FALLBACK_IMAGE,
      quantity: 1,
      unitPrice: listing.price,
    })
  }

  return (
    <article
      role='button'
      tabIndex={0}
      onClick={() => {
        onSelect?.()
        navigateToDetail()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect?.()
          navigateToDetail()
        }
      }}
      className={`cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
        selected ? 'border-[#FF385C] ring-2 ring-[#FF385C]/20' : 'border-neutral-200'
      } ${compact ? 'min-w-[240px] max-w-[240px]' : 'w-full'}`}
    >
      <div className='relative aspect-[4/3] overflow-hidden'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.image ?? FALLBACK_IMAGE}
          alt={listing.title}
          className='h-full w-full object-cover transition duration-300 hover:scale-105'
        />
        {onToggleFavorite ? (
          <button
            type='button'
            className='absolute right-3 top-3 rounded-full bg-white/90 p-2 backdrop-blur'
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            aria-label={isFavorite ? 'Quitar favorito' : 'Agregar favorito'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-black stroke-black' : ''}`} />
          </button>
        ) : null}
        {listing.listingType !== 'product' ? (
          <span className='absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white'>
            {getListingTypeLabel(listing.listingType)}
          </span>
        ) : null}
        {listing.listingType === 'product' ? (
          <div className='absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2'>
            <div className='rounded-xl bg-white/95 px-3 py-1.5 backdrop-blur'>
              <div className='text-sm font-semibold'>{formatMoney(listing.price)}</div>
            </div>
            {quantity === 0 ? (
              <button
                type='button'
                onClick={handleAdd}
                className='rounded-full border bg-white/95 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-neutral-50'
              >
                + Agregar
              </button>
            ) : (
              <div
                className='flex items-center gap-1 rounded-full border bg-white/95 px-2 py-1 shadow-sm'
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type='button'
                  onClick={() => setQuantity('product', variantId, quantity - 1)}
                  className='inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-neutral-100'
                >
                  <Minus className='h-3.5 w-3.5' />
                </button>
                <span className='w-5 text-center text-xs font-medium'>{quantity}</span>
                <button
                  type='button'
                  onClick={() => setQuantity('product', variantId, quantity + 1)}
                  className='inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-neutral-100'
                >
                  <Plus className='h-3.5 w-3.5' />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className='space-y-1.5 p-3'>
        <h3 className='line-clamp-1 text-sm font-semibold text-neutral-900'>{listing.title}</h3>
        <p className='line-clamp-1 text-xs text-neutral-600'>{listing.storeName}</p>
        {listing.distanceLabel ? (
          <p className='flex items-center gap-1 text-xs text-neutral-500'>
            <MapPin className='h-3 w-3 shrink-0' />
            A {listing.distanceLabel.replace(' de vos', '')}
          </p>
        ) : null}
        {listing.listingType !== 'product' ? (
          <p className='text-sm font-semibold'>{formatMoney(listing.price)}</p>
        ) : null}
        <div className='flex flex-wrap gap-1 pt-1'>
          <span className='inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-[10px] text-neutral-400'>
            <Truck className='h-3 w-3' />
            Envío
          </span>
          <span className='inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-[10px] text-neutral-400'>
            <Store className='h-3 w-3' />
            Retiro
          </span>
        </div>
        {!compact ? (
          <Link
            href={`/listing/${listing.listingType}/${listing.id}`}
            onClick={(e) => e.stopPropagation()}
            className='inline-block pt-1 text-xs font-medium text-[#FF385C] hover:underline'
          >
            Ver detalle
          </Link>
        ) : null}
      </div>
    </article>
  )
}
