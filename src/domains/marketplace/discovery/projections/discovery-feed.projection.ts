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

type OfferVariantRow = {
  id: string
  price: number
  is_default: boolean
  attributes_json: Record<string, unknown> | null
  legacy_variant_id: string | null
  offer: { publication_id: string }
}

function toVariantFeedRow(row: OfferVariantRow, listingKey: string): VariantFeedRow {
  return {
    id: row.id,
    listing_id: listingKey,
    price: row.price,
    is_default: row.is_default,
    attributes_json: row.attributes_json,
  }
}

async function fetchOfferVariantsByPublicationIds(
  publicationIds: string[],
  listingKeyByPublicationId: Map<string, string>,
): Promise<Map<string, VariantFeedRow[]>> {
  const map = new Map<string, VariantFeedRow[]>()
  if (publicationIds.length === 0) return map

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('offer_variant')
    .select(
      'id, price, is_default, attributes_json, legacy_variant_id, offer!inner(publication_id, is_active)',
    )
    .in('offer.publication_id', publicationIds)
    .eq('offer.is_active', true)

  if (error) throwOnSupabaseError(error)

  for (const row of (data ?? []) as OfferVariantRow[]) {
    const publicationId = row.offer.publication_id
    const listingKey = listingKeyByPublicationId.get(publicationId) ?? publicationId
    const list = map.get(listingKey) ?? []
    list.push(toVariantFeedRow(row, listingKey))
    map.set(listingKey, list)
  }
  return map
}

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

function mergePricingMaps(
  offerVariants: Map<string, VariantFeedRow[]>,
  listingVariants: Map<string, VariantFeedRow[]>,
): Map<string, VariantFeedRow[]> {
  const merged = new Map(listingVariants)
  for (const [key, rows] of offerVariants) {
    if (rows.length > 0) {
      merged.set(key, rows)
    }
  }
  return merged
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

  const publicationIds = rows.map((r) => r.id)
  const listingKeyByPublicationId = new Map(
    rows.map((r) => [r.id, r.legacy_listing_id ?? r.id]),
  )
  const listingIds = [...new Set(listingKeyByPublicationId.values())]
  const storeIds = [...new Set(rows.filter((r) => r.owner_type === 'store').map((r) => r.owner_id))]
  const categoryIds = [...new Set(rows.map((r) => r.taxonomy_node_id))]

  const [offerVariants, listingVariants, storeNames, categoryNames] = await Promise.all([
    fetchOfferVariantsByPublicationIds(publicationIds, listingKeyByPublicationId),
    fetchVariantsByListingIds(listingIds),
    fetchStoreNames(storeIds),
    fetchCategoryNames(categoryIds),
  ])

  const variantsByListingId = mergePricingMaps(offerVariants, listingVariants)

  return mapPublicationRowsToMarketplaceListings(
    rows,
    variantsByListingId,
    storeNames,
    categoryNames,
  )
}
