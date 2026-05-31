'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'

import { cn } from '@/shared/utils/utils'
import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'
import type { VendorCategory, VendorProfile, VendorReview } from '@/domains/vendors/domain/vendor'

import { VENDOR_TABS, type VendorTabId } from './vendor-tabs-config'
import { VendorHomeTab } from './vendor-home-tab'
import { VendorProductsTab } from './vendor-products-tab'
import { VendorReviewsTab } from './vendor-reviews-tab'

const VendorMapTab = dynamic(() => import('./vendor-map-tab').then((m) => m.VendorMapTab), {
  ssr: false,
  loading: () => <div className='h-[360px] animate-pulse rounded-2xl bg-neutral-200' />,
})

export function VendorTabs({
  profile,
  initialListings,
  categories,
  initialReviews,
  isAuthenticated,
  isOwner,
  myReview,
}: {
  profile: VendorProfile
  initialListings: MarketplaceListing[]
  categories: VendorCategory[]
  initialReviews: VendorReview[]
  isAuthenticated: boolean
  isOwner: boolean
  myReview: VendorReview | null
}) {
  const [tab, setTab] = useState<VendorTabId>('inicio')

  return (
    <div>
      <div className='sticky top-0 z-20 -mx-4 border-b border-neutral-200 bg-white/80 px-4 backdrop-blur sm:mx-0 sm:rounded-t-none'>
        <nav className='mx-auto flex max-w-5xl gap-1 overflow-x-auto'>
          {VENDOR_TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type='button'
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
                  active ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800',
                )}
              >
                {t.label}
                {active ? (
                  <motion.span
                    layoutId='vendor-tab-underline'
                    className='absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-neutral-900'
                  />
                ) : null}
              </button>
            )
          })}
        </nav>
      </div>

      <div className='mx-auto max-w-5xl px-4 py-6 sm:px-0'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'inicio' ? (
              <VendorHomeTab
                bio={profile.bio}
                listings={initialListings}
                categories={categories}
                reviews={initialReviews}
                onNavigate={setTab}
              />
            ) : null}

            {tab === 'productos' ? (
              <VendorProductsTab
                storeId={profile.id}
                storeName={profile.name}
                initialListings={initialListings}
              />
            ) : null}

            {tab === 'reviews' ? (
              <VendorReviewsTab
                storeId={profile.id}
                slug={profile.slug}
                ratingAvg={profile.ratingAvg}
                reviewCount={profile.reviewCount}
                initialReviews={initialReviews}
                isAuthenticated={isAuthenticated}
                isOwner={isOwner}
                myReview={myReview}
              />
            ) : null}

            {tab === 'mapa' ? (
              <VendorMapTab
                latitude={profile.latitude}
                longitude={profile.longitude}
                address={profile.address}
                name={profile.name}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
