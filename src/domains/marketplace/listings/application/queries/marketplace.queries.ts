import { createClient } from '@/shared/database/supabase/server'
import { throwOnSupabaseError } from '@/shared/database/supabase/connection-error'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'

type FetchOptions = {
  listingTypes?: ListingType[]
  limit?: number
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

function mapRowToMarketplaceListing(row: ListingRow): MarketplaceListing {
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
    storeName: row.store?.name ?? 'Vendedor',
    categoryId: String(row.category_id),
    categoryName: row.category?.name ?? undefined,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    variantId: defaultVariant ? String(defaultVariant.id) : undefined,
    hasOptions: variantRows.length > 1,
    createdAt: row.created_at,
  }
}

export async function fetchMarketplaceListings(
  options: FetchOptions = {},
): Promise<MarketplaceListing[]> {
  const { listingTypes, limit = 200 } = options
  const supabase = await createClient()

  let query = supabase
    .from('listing')
    .select(
      'id,title,price,latitude,longitude,listing_type,category_id,store_id,created_at,store(name),category(name),listing_variant(id,price,is_default,attributes_json)',
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (listingTypes && listingTypes.length > 0) {
    query = query.in('listing_type', listingTypes)
  }

  const { data, error } = await query

  if (error) throwOnSupabaseError(error)

  return ((data ?? []) as ListingRow[]).map(mapRowToMarketplaceListing)
}

export type PublicStoreSummary = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  ratingAvg: number
  reviewCount: number
}

export async function fetchPublicStores(): Promise<PublicStoreSummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('store')
    .select('id, name, slug, logo_url, rating_avg, review_count')
    .eq('status', 'active')
    .not('slug', 'is', null)
    .order('name', { ascending: true })

  if (error) throwOnSupabaseError(error)

  return ((data ?? []) as Array<{
    id: string
    name: string
    slug: string | null
    logo_url: string | null
    rating_avg: number
    review_count: number
  }>)
    .filter((row): row is typeof row & { slug: string } => Boolean(row.slug))
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logo_url,
      ratingAvg: Number(row.rating_avg),
      reviewCount: row.review_count,
    }))
}

export async function fetchMarketplaceCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('category')
    .select('id, name, listing_type')
    .eq('is_visible', true)
    .order('name', { ascending: true })

  if (error) throwOnSupabaseError(error)

  const rows = (data ?? []) as Array<{ id: string; name: string; listing_type: string }>
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    listingType: row.listing_type as ListingType,
  }))
}
