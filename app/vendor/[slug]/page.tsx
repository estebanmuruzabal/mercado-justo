import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import {
  getVendorBySlug,
  getVendorCategories,
  getVendorListings,
  getVendorReviews,
  getViewerVendorState,
} from '@/server/queries/vendor.queries'
import { VendorHero } from '@/components/vendor-public/vendor-hero'
import { VendorTabs } from '@/components/vendor-public/vendor-tabs'

const INITIAL_LISTINGS = 12
const INITIAL_REVIEWS = 8

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = await getVendorBySlug(slug)
  if (!profile) return { title: 'Tienda no encontrada' }

  const description = profile.bio ?? `Descubrí los productos de ${profile.name} en Mercado Justo.`
  return {
    title: `${profile.name} · Mercado Justo`,
    description,
    openGraph: {
      title: profile.name,
      description,
      images: profile.bannerUrl ? [{ url: profile.bannerUrl }] : undefined,
    },
  }
}

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = await getVendorBySlug(slug)

  if (!profile) notFound()

  const [listings, categories, reviewsPage, viewer] = await Promise.all([
    getVendorListings({ storeId: profile.id, storeName: profile.name, limit: INITIAL_LISTINGS }),
    getVendorCategories(profile.id),
    getVendorReviews({ storeId: profile.id, limit: INITIAL_REVIEWS }),
    getViewerVendorState(profile.id),
  ])

  return (
    <main className='min-h-screen bg-neutral-50 pb-16'>
      <VendorHero
        profile={profile}
        isAuthenticated={viewer.isAuthenticated}
        isOwner={viewer.isOwner}
        isFollowing={viewer.isFollowing}
      />
      <div className='mt-8'>
        <VendorTabs
          profile={profile}
          initialListings={listings}
          categories={categories}
          initialReviews={reviewsPage.reviews}
          isAuthenticated={viewer.isAuthenticated}
          isOwner={viewer.isOwner}
          myReview={viewer.myReview}
        />
      </div>
    </main>
  )
}
