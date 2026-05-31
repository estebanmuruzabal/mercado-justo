import { cache } from 'react'

import { createClient } from '@/shared/database/supabase/server'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'
import type {
  VendorCategory,
  VendorProfile,
  VendorReview,
  VendorReviewsPage,
  ViewerVendorState,
} from '@/domains/vendors/domain/vendor'
import type { StoreMode } from '@/domains/vendors/domain/store'

const VENDOR_SELECT =
  'id,slug,name,bio,banner_url,logo_url,address,latitude,longitude,instagram,whatsapp_number,show_whatsapp,mode,allow_followers,follower_count,review_count,rating_avg,created_at'

type VendorRow = {
  id: string
  slug: string | null
  name: string
  bio: string | null
  banner_url: string | null
  logo_url: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  instagram: string | null
  whatsapp_number: string | null
  show_whatsapp: boolean
  mode: string
  allow_followers: boolean
  follower_count: number
  review_count: number
  rating_avg: number
  created_at: string
}

function mapVendorRow(row: VendorRow): VendorProfile {
  return {
    id: row.id,
    slug: row.slug ?? '',
    name: row.name,
    bio: row.bio,
    bannerUrl: row.banner_url,
    logoUrl: row.logo_url,
    address: row.address,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    instagram: row.instagram,
    whatsappNumber: row.whatsapp_number,
    showWhatsapp: row.show_whatsapp,
    mode: row.mode as StoreMode,
    allowFollowers: row.allow_followers,
    followerCount: row.follower_count,
    reviewCount: row.review_count,
    ratingAvg: Number(row.rating_avg),
    createdAt: row.created_at,
  }
}

/**
 * Cached per request so `generateMetadata` and the page render share a single
 * DB round-trip for the same slug.
 */
export const getVendorBySlug = cache(async (slug: string): Promise<VendorProfile | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store')
    .select(VENDOR_SELECT)
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data ? mapVendorRow(data as VendorRow) : null
})

/** Resolve the public slug for a store id (used to redirect legacy /seller links). */
export async function getVendorSlugByStoreId(storeId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store')
    .select('slug')
    .eq('id', storeId)
    .maybeSingle()

  if (error) throw error
  return (data as { slug: string | null } | null)?.slug ?? null
}

type ListingRow = {
  id: string
  title: string | null
  price: number | null
  latitude: number | null
  longitude: number | null
  listing_type: string
  category_id: string
  store_id: string
  created_at: string
  store?: { name: string | null } | null
  category?: { name: string | null } | null
  listing_variant?: Array<{
    id: string
    price: number | null
    is_default: boolean
    attributes_json?: unknown
  }> | null
}

function mapListingRow(row: ListingRow, storeName: string): MarketplaceListing {
  const variantRows = row.listing_variant ?? []
  const defaultVariant = variantRows.find((v) => v.is_default) ?? variantRows[0]
  const attrs = (defaultVariant?.attributes_json ?? {}) as Record<string, unknown>
  const titleFromAttrs = typeof attrs.name === 'string' ? attrs.name : null
  const imageFromAttrs = typeof attrs.image === 'string' ? attrs.image : null
  const variantPrice = defaultVariant?.price ?? row.price ?? 0

  return {
    id: String(row.id),
    listingType: row.listing_type as ListingType,
    title: titleFromAttrs ?? row.title ?? '',
    price: Number(variantPrice),
    image: imageFromAttrs,
    storeId: String(row.store_id),
    storeName: row.store?.name ?? storeName,
    categoryId: String(row.category_id),
    categoryName: row.category?.name ?? undefined,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    variantId: defaultVariant ? String(defaultVariant.id) : undefined,
    hasOptions: variantRows.length > 1,
    createdAt: row.created_at,
  }
}

export async function getVendorListings(options: {
  storeId: string
  storeName?: string
  limit?: number
  offset?: number
  listingType?: ListingType
}): Promise<MarketplaceListing[]> {
  const { storeId, storeName = 'Vendedor', limit = 12, offset = 0, listingType } = options
  const supabase = await createClient()

  let query = supabase
    .from('listing')
    .select(
      'id,title,price,latitude,longitude,listing_type,category_id,store_id,created_at,store(name),category(name),listing_variant(id,price,is_default,attributes_json)',
    )
    .eq('store_id', storeId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (listingType) {
    query = query.eq('listing_type', listingType)
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as ListingRow[]).map((row) => mapListingRow(row, storeName))
}

export async function getVendorCategories(storeId: string): Promise<VendorCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listing')
    .select('category_id,category(name)')
    .eq('store_id', storeId)
    .eq('status', 'published')

  if (error) throw error

  const counts = new Map<string, VendorCategory>()
  for (const row of (data ?? []) as Array<{
    category_id: string
    category?: { name: string | null } | null
  }>) {
    const existing = counts.get(row.category_id)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(row.category_id, {
        id: row.category_id,
        name: row.category?.name ?? 'Categoría',
        count: 1,
      })
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count)
}

type ReviewRow = {
  id: string
  author_id: string
  author_name: string | null
  author_avatar_url: string | null
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

function mapReviewRow(row: ReviewRow): VendorReview {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getVendorReviews(options: {
  storeId: string
  limit?: number
  offset?: number
}): Promise<VendorReviewsPage> {
  const { storeId, limit = 8, offset = 0 } = options
  const supabase = await createClient()

  const { data, error, count } = await supabase
    .from('store_review')
    .select('id,author_id,author_name,author_avatar_url,rating,comment,created_at,updated_at', {
      count: 'exact',
    })
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return {
    reviews: ((data ?? []) as ReviewRow[]).map(mapReviewRow),
    total: count ?? 0,
  }
}

/** Auth-aware viewer state: ownership, follow status, and existing review. */
export async function getViewerVendorState(storeId: string): Promise<ViewerVendorState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isAuthenticated: false, isOwner: false, isFollowing: false, myReview: null }
  }

  const [followRes, reviewRes] = await Promise.all([
    supabase
      .from('vendor_follower')
      .select('store_id')
      .eq('store_id', storeId)
      .eq('follower_id', user.id)
      .maybeSingle(),
    supabase
      .from('store_review')
      .select('id,author_id,author_name,author_avatar_url,rating,comment,created_at,updated_at')
      .eq('store_id', storeId)
      .eq('author_id', user.id)
      .maybeSingle(),
  ])

  return {
    isAuthenticated: true,
    isOwner: user.id === storeId,
    isFollowing: Boolean(followRes.data),
    myReview: reviewRes.data ? mapReviewRow(reviewRes.data as ReviewRow) : null,
  }
}
