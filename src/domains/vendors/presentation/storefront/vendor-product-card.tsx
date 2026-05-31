'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { getListingTypeLabel } from '@/domains/marketplace/listings/domain/listing'
import { isConfiguredRemoteImage, listingImageSrc } from '@/domains/marketplace/listings/domain/listing-image'
import { listingDetailPath } from '@/shared/routing/routes'
import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'

function formatMoney(amount: number) {
  return `$${amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
}

export function VendorProductCard({ listing, index = 0 }: { listing: MarketplaceListing; index?: number }) {
  const src = listingImageSrc(listing.image)
  const unoptimized = !isConfiguredRemoteImage(src)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link
        href={listingDetailPath(listing.listingType, listing.id)}
        className='group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'
      >
        <div className='relative aspect-square overflow-hidden bg-neutral-100'>
          <Image
            src={src}
            alt={listing.title}
            fill
            sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
            unoptimized={unoptimized}
            className='object-cover transition duration-500 group-hover:scale-105'
          />
          {listing.listingType !== 'product' ? (
            <span className='absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur'>
              {getListingTypeLabel(listing.listingType)}
            </span>
          ) : null}
        </div>
        <div className='space-y-1 p-3'>
          <h3 className='line-clamp-1 text-sm font-semibold text-neutral-900'>{listing.title}</h3>
          {listing.categoryName ? (
            <p className='line-clamp-1 text-xs text-neutral-500'>{listing.categoryName}</p>
          ) : null}
          <p className='pt-0.5 text-base font-bold text-neutral-900'>{formatMoney(listing.price)}</p>
        </div>
      </Link>
    </motion.div>
  )
}

export function VendorProductCardSkeleton() {
  return (
    <div className='overflow-hidden rounded-2xl border border-neutral-200 bg-white'>
      <div className='aspect-square animate-pulse bg-neutral-200' />
      <div className='space-y-2 p-3'>
        <div className='h-4 w-3/4 animate-pulse rounded bg-neutral-200' />
        <div className='h-3 w-1/2 animate-pulse rounded bg-neutral-200' />
        <div className='h-4 w-1/3 animate-pulse rounded bg-neutral-200' />
      </div>
    </div>
  )
}
