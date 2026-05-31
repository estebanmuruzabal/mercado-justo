import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import {
  getVendorBySlug,
  getVendorCategories,
  getVendorReviews,
  getViewerVendorState,
} from '@/domains/vendors/application/queries/vendor.queries'
import { buildVendorFeed } from '@/domains/marketplace/discovery'
import { VendorHero } from '@/domains/vendors/presentation/storefront/vendor-hero'
import { VendorTabs } from '@/domains/vendors/presentation/storefront/vendor-tabs'

const INITIAL_LISTINGS = 12
const INITIAL_REVIEWS = 8

const SITE_NAME = 'Mercado Justo'
const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = await getVendorBySlug(slug)

  if (!profile) {
    return {
      title: { absolute: `Tienda no encontrada | ${SITE_NAME}` },
      robots: { index: false, follow: false },
    }
  }

  const title = `${profile.name} | ${SITE_NAME}`
  const description =
    profile.bio?.trim() ||
    `Descubrí los productos de ${profile.name} en ${SITE_NAME}. Seguí la tienda y contactá al vendedor.`
  const image = profile.bannerUrl || profile.logoUrl || DEFAULT_OG_IMAGE
  const url = `/vendor/${profile.slug}`

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      siteName: SITE_NAME,
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: profile.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
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
    buildVendorFeed({ storeId: profile.id, limit: INITIAL_LISTINGS }),
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
