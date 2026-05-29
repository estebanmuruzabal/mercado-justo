'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'

import type { MarketplaceListingWithDistance } from '@/types/marketplace'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop'

export function ListingMapPopup({ listing }: { listing: MarketplaceListingWithDistance }) {
  return (
    <div className='min-w-[180px] space-y-2 p-1'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={listing.image ?? FALLBACK_IMAGE}
        alt={listing.title}
        className='h-24 w-full rounded-lg object-cover'
      />
      <div>
        <p className='line-clamp-1 text-sm font-semibold'>{listing.title}</p>
        <p className='text-xs text-neutral-600'>{listing.storeName}</p>
        {listing.distanceLabel ? (
          <p className='mt-1 flex items-center gap-1 text-xs text-neutral-500'>
            <MapPin className='h-3 w-3' />
            A {listing.distanceLabel.replace(' de vos', '')}
          </p>
        ) : null}
        <p className='mt-1 text-sm font-semibold'>
          ${listing.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <Link
          href={`/listing/${listing.listingType}/${listing.id}`}
          className='mt-2 inline-block text-xs font-medium text-[#FF385C] hover:underline'
        >
          Ver detalle
        </Link>
      </div>
    </div>
  )
}

export function buildListingPopupHtml(listing: MarketplaceListingWithDistance): string {
  const image = listing.image ?? FALLBACK_IMAGE
  const distance = listing.distanceLabel
    ? `<p style="margin:4px 0;font-size:12px;color:#737373">A ${listing.distanceLabel.replace(' de vos', '')}</p>`
    : ''
  return `
    <div style="min-width:160px">
      <img src="${image}" alt="${listing.title}" style="width:100%;height:80px;object-fit:cover;border-radius:8px" />
      <p style="margin:6px 0 2px;font-weight:600;font-size:13px">${listing.title}</p>
      <p style="margin:0;font-size:12px;color:#737373">${listing.storeName}</p>
      ${distance}
      <p style="margin:4px 0;font-weight:600;font-size:13px">$${listing.price.toLocaleString()}</p>
      <a href="/listing/${listing.listingType}/${listing.id}" style="font-size:12px;color:#FF385C">Ver detalle</a>
    </div>
  `
}
