import { createClient } from '@/shared/database/supabase/server'
import { throwOnSupabaseError } from '@/shared/database/supabase/connection-error'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'
import {
  mapPublicationRowsToMarketplaceListings,
  type PublicationFeedRow,
  type VariantFeedRow,
} from '../application/mappers/publication-to-discovery.mapper'

export type BuildDiscoveryFeedOptions = {
  listingTypes?: ListingType[]
  limit?: number
}

const PUBLICATION_FEED_SELECT =
  'id, legacy_listing_id, publication_type, title, taxonomy_node_id, owner_id, owner_type, latitude, longitude, created_at, attributes_json'

async function fetchVariantsByListingIds(
  listingIds: string[],
): Promise<Map<string, VariantFeedRow[]>> {
  const map = new Map<string, VariantFeedRow[]>()
  if (listingIds.length === 0) return map

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listing_variant')
    .select('id, listing_id, price, is_default, attributes_json')
    .in('listing_id', listingIds)

  if (error) throwOnSupabaseError(error)

  for (const row of (data ?? []) as VariantFeedRow[]) {
    const key = row.listing_id
    const list = map.get(key) ?? []
    list.push(row)
    map.set(key, list)
  }
  return map
}

async function fetchStoreNames(storeIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>()
  if (storeIds.length === 0) return names

  const supabase = await createClient()
  const { data, error } = await supabase.from('store').select('id, name').in('id', storeIds)
  if (error) throwOnSupabaseError(error)

  for (const row of (data ?? []) as Array<{ id: string; name: string }>) {
    names.set(row.id, row.name)
  }
  return names
}

async function fetchCategoryNames(categoryIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>()
  if (categoryIds.length === 0) return names

  const supabase = await createClient()
  const { data: taxonomyData } = await supabase
    .from('taxonomy_node')
    .select('id, name')
    .in('id', categoryIds)

  for (const row of (taxonomyData ?? []) as Array<{ id: string; name: string }>) {
    names.set(row.id, row.name)
  }

  const missing = categoryIds.filter((id) => !names.has(id))
  if (missing.length > 0) {
    const { data: categoryData } = await supabase
      .from('category')
      .select('id, name')
      .in('id', missing)
    for (const row of (categoryData ?? []) as Array<{ id: string; name: string }>) {
      names.set(row.id, row.name)
    }
  }

  return names
}

export async function buildDiscoveryFeed(
  options: BuildDiscoveryFeedOptions = {},
): Promise<MarketplaceListing[]> {
  const { listingTypes, limit = 200 } = options
  const supabase = await createClient()

  let query = supabase
    .from('publication')
    .select(PUBLICATION_FEED_SELECT)
    .eq('lifecycle_state', 'published')
    .eq('visibility', 'public')
    .eq('moderation_status', 'approved')
    .eq('structural_role', 'root')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (listingTypes && listingTypes.length > 0) {
    query = query.in('publication_type', listingTypes)
  }

  const { data, error } = await query
  if (error) throwOnSupabaseError(error)

  const rows = (data ?? []) as PublicationFeedRow[]
  if (rows.length === 0) return []

  const listingIds = rows.map((r) => r.legacy_listing_id ?? r.id)
  const storeIds = [...new Set(rows.filter((r) => r.owner_type === 'store').map((r) => r.owner_id))]
  const categoryIds = [...new Set(rows.map((r) => r.taxonomy_node_id))]

  const [variantsByListingId, storeNames, categoryNames] = await Promise.all([
    fetchVariantsByListingIds(listingIds),
    fetchStoreNames(storeIds),
    fetchCategoryNames(categoryIds),
  ])

  return mapPublicationRowsToMarketplaceListings(
    rows,
    variantsByListingId,
    storeNames,
    categoryNames,
  )
}
