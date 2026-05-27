'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Minus, Plus } from 'lucide-react'

import type { Listing, ProductListing } from './listing-section'
import { getListingTypeLabel } from '@/lib/listing'

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

type BaseCardProps = {
  listing: Listing
  isFavorite: boolean
  onToggleFavorite: () => void
}

type ProductCardProps = BaseCardProps & {
  listing: ProductListing
  quantity: number
  onAdd: () => void
  onMinus: () => void
  onPlus: () => void
  onOpenOptions: () => void
}

export function ProductListingCard({
  listing,
  isFavorite,
  onToggleFavorite,
  quantity,
  onAdd,
  onMinus,
  onPlus,
  onOpenOptions,
}: ProductCardProps) {
  const router = useRouter()
  const hasQuantity = quantity > 0

  function navigateToProductDetail() {
    router.push(`/listing/product/${listing.id}`)
  }

  return (
    <div
      className='min-w-[280px] max-w-[280px] cursor-pointer'
      role='button'
      tabIndex={0}
      onClick={() => navigateToProductDetail()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigateToProductDetail()
      }}
    >
      <div className='relative overflow-hidden rounded-3xl bg-white shadow-sm'>
        <img
          src={listing.image}
          alt={listing.title}
          className='h-[260px] w-full object-cover transition duration-300 hover:scale-105'
          onClick={(e) => {
            // Clicking the image navigates as required, but avoid any side effects from nested button handlers.
            e.stopPropagation()
            navigateToProductDetail()
          }}
        />

        <button
          type='button'
          className='absolute right-4 top-4 rounded-full bg-white/90 p-2 backdrop-blur'
          onClick={(e) => {
            // Keep favorite interaction working without triggering card navigation.
            e.stopPropagation()
            onToggleFavorite()
          }}
          aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-black stroke-black' : ''}`} />
        </button>

        <div className='absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3'>
          <div>
            <div className='text-lg font-semibold tracking-tight'>{formatMoney(listing.price)}</div>
            {listing.priceSecondary ? (
              <div className='text-xs text-muted-foreground'>{listing.priceSecondary}</div>
            ) : null}
          </div>

          {!hasQuantity && listing.hasOptions ? (
            <button
              type='button'
              onClick={(e) => {
                // For now, Options navigates to the product detail page (no modal).
                e.stopPropagation()
                onOpenOptions()
                navigateToProductDetail()
              }}
              className='rounded-full border bg-white/95 px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground cursor-pointer'
            >
              Ver opciones mejor
            </button>
          ) : null}

          {!hasQuantity && !listing.hasOptions ? (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
              className='rounded-full border bg-white/95 px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground cursor-pointer'
            >
              + Add
            </button>
          ) : null}

          {hasQuantity ? (
            <div className='flex items-center gap-2 rounded-full border bg-white/95 px-3 py-2 shadow-xs'>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  onMinus()
                }}
                className='inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted'
                aria-label='Decrease quantity'
              >
                <Minus className='h-4 w-4' />
              </button>
              <div className='w-8 text-center text-sm font-medium'>{quantity}</div>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  onPlus()
                }}
                className='inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted'
                aria-label='Increase quantity'
              >
                <Plus className='h-4 w-4' />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className='mt-3'>
        <h3 className='line-clamp-1 text-base font-semibold'>{listing.title}</h3>
        <p className='text-sm text-muted-foreground'>{listing.subtitle}</p>
      </div>
    </div>
  )
}

type OtherCardProps = BaseCardProps & {
  listing: Exclude<Listing, ProductListing>
}

function ServiceListingCard({ listing, isFavorite, onToggleFavorite }: OtherCardProps) {
  return (
    <Link
      href={`/listing/${listing.listingType}/${listing.id}`}
      className='min-w-[280px] max-w-[280px] cursor-pointer'
    >
      <div className='rounded-3xl bg-white shadow-sm'>
        <div className='relative overflow-hidden rounded-3xl'>
          <img
            src={listing.image}
            alt={listing.title}
            className='h-[220px] w-full object-cover transition duration-300 hover:scale-105'
          />

          <button
            type='button'
            className='absolute right-4 top-4 rounded-full bg-white/90 p-2 backdrop-blur'
            onClick={(e) => {
              e.preventDefault()
              onToggleFavorite()
            }}
            aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-black stroke-black' : ''}`} />
          </button>

          <div className='absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white'>
            {getListingTypeLabel(listing.listingType)}
          </div>
        </div>

        <div className='space-y-2 p-3'>
          <h3 className='line-clamp-1 text-base font-semibold'>{listing.title}</h3>
          <p className='text-sm text-muted-foreground'>{listing.subtitle}</p>

          <div className='flex items-center justify-between'>
            <div className='text-xs text-muted-foreground'>Fast response</div>
            <div className='rounded-full border bg-white/95 px-3 py-1 text-xs font-medium'>
              Request quote
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function PropertyListingCard({ listing, isFavorite, onToggleFavorite }: OtherCardProps) {
  return (
    <Link
      href={`/listing/${listing.listingType}/${listing.id}`}
      className='min-w-[280px] max-w-[280px] cursor-pointer'
    >
      <div className='min-w-[280px] max-w-[280px] rounded-3xl bg-white shadow-sm'>
        <div className='relative overflow-hidden rounded-3xl'>
          <img
            src={listing.image}
            alt={listing.title}
            className='h-[260px] w-full object-cover transition duration-300 hover:scale-105'
          />

          <button
            type='button'
            className='absolute right-4 top-4 rounded-full bg-white/90 p-2 backdrop-blur'
            onClick={(e) => {
              e.preventDefault()
              onToggleFavorite()
            }}
            aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-black stroke-black' : ''}`} />
          </button>

          <div className='absolute bottom-4 left-4 rounded-2xl bg-white/90 px-3 py-2 backdrop-blur'>
            <div className='text-sm font-semibold'>{listing.subtitle}</div>
            <div className='text-xs text-muted-foreground'>per night</div>
          </div>
        </div>

        <div className='p-3'>
          <h3 className='line-clamp-1 text-base font-semibold'>{listing.title}</h3>

          <div className='mt-2 flex items-center justify-between'>
            <div className='text-xs text-muted-foreground'>Great location</div>
            <div className='rounded-full border bg-white/95 px-3 py-1 text-xs font-medium'>
              View dates
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function ExperienceListingCard({ listing, isFavorite, onToggleFavorite }: OtherCardProps) {
  return (
    <Link
      href={`/listing/${listing.listingType}/${listing.id}`}
      className='min-w-[280px] max-w-[280px] cursor-pointer'
    >
      <div className='min-w-[280px] max-w-[280px] rounded-3xl bg-white shadow-sm'>
        <div className='relative overflow-hidden rounded-3xl'>
          <img
            src={listing.image}
            alt={listing.title}
            className='h-[240px] w-full object-cover transition duration-300 hover:scale-105'
          />

          <button
            type='button'
            className='absolute right-4 top-4 rounded-full bg-white/90 p-2 backdrop-blur'
            onClick={(e) => {
              e.preventDefault()
              onToggleFavorite()
            }}
            aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-black stroke-black' : ''}`} />
          </button>

          <div className='absolute right-4 bottom-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white'>
            {getListingTypeLabel(listing.listingType)}
          </div>
        </div>

        <div className='p-3'>
          <h3 className='line-clamp-1 text-base font-semibold'>{listing.title}</h3>
          <p className='mt-2 text-sm text-muted-foreground'>{listing.subtitle}</p>

          <div className='mt-3 flex items-center justify-between rounded-2xl border bg-white/95 px-3 py-2'>
            <div className='text-xs text-muted-foreground'>Includes guide</div>
            <div className='text-xs font-medium'>See itinerary</div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function LinkCard({
  listing,
  isFavorite,
  onToggleFavorite,
}: BaseCardProps) {
  return (
    <Link
      href={`/listing/${listing.listingType}/${listing.id}`}
      className='min-w-[280px] max-w-[280px] cursor-pointer'
    >
      <div className='relative overflow-hidden rounded-3xl bg-white shadow-sm'>
        <img
          src={listing.image}
          alt={listing.title}
          className='h-[260px] w-full object-cover transition duration-300 hover:scale-105'
        />

        <button
          type='button'
          className='absolute right-4 top-4 rounded-full bg-white/90 p-2 backdrop-blur'
          onClick={(e) => {
            e.preventDefault()
            onToggleFavorite()
          }}
          aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-black stroke-black' : ''}`} />
        </button>
      </div>

      <div className='mt-3'>
        <h3 className='line-clamp-1 text-base font-semibold'>{listing.title}</h3>
        <p className='text-sm text-muted-foreground'>{listing.subtitle}</p>
      </div>
    </Link>
  )
}

type ListingCardProps = {
  listing: Listing
  quantity?: number
  isFavorite: boolean
  onToggleFavorite: () => void
  onAdd?: () => void
  onMinus?: () => void
  onPlus?: () => void
  onOpenOptions?: () => void
}

export function ListingCard({
  listing,
  quantity = 0,
  isFavorite,
  onToggleFavorite,
  onAdd,
  onMinus,
  onPlus,
  onOpenOptions,
}: ListingCardProps) {
  if (listing.listingType === 'product') {
    return (
      <ProductListingCard
        listing={listing}
        quantity={quantity}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        onAdd={onAdd ?? (() => {})}
        onMinus={onMinus ?? (() => {})}
        onPlus={onPlus ?? (() => {})}
        onOpenOptions={onOpenOptions ?? (() => {})}
      />
    )
  }

  if (listing.listingType === 'service') {
    return <ServiceListingCard listing={listing} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
  }

  if (listing.listingType === 'property') {
    return <PropertyListingCard listing={listing} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
  }

  if (listing.listingType === 'experience') {
    return <ExperienceListingCard listing={listing} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
  }

  // Fallback (should be unreachable).
  return <LinkCard listing={listing} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
}