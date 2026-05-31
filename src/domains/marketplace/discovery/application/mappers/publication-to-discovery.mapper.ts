import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'

export type PublicationFeedRow = {
  id: string
  legacy_listing_id: string | null
  publication_type: string
  title: string | null
  taxonomy_node_id: string
  owner_id: string
  owner_type: string
  latitude: number | null
  longitude: number | null
  created_at: string
  attributes_json?: Record<string, unknown> | null
}

export type VariantFeedRow = {
  id: string
  listing_id: string
  price: number | null
  is_default: boolean
  attributes_json?: Record<string, unknown> | null
}

export type StoreNameLookup = Map<string, string>
export type CategoryNameLookup = Map<string, string>

export function mapPublicationRowToMarketplaceListing(
  row: PublicationFeedRow,
  variantRows: VariantFeedRow[],
  storeNames: StoreNameLookup,
  categoryNames: CategoryNameLookup,
): MarketplaceListing {
  const listingKey = row.legacy_listing_id ?? row.id
  const defaultVariant = variantRows.find((v) => v.is_default) ?? variantRows[0]
  const attrs = (defaultVariant?.attributes_json ?? row.attributes_json ?? {}) as Record<
    string,
    unknown
  >
  const titleFromAttrs = typeof attrs.name === 'string' ? attrs.name : null
  const imageFromAttrs = typeof attrs.image === 'string' ? attrs.image : null

  return {
    id: String(listingKey),
    publicationId: row.id,
    listingType: row.publication_type as ListingType,
    title: titleFromAttrs ?? row.title ?? '',
    price: Number(defaultVariant?.price ?? 0),
    image: imageFromAttrs,
    storeId: String(row.owner_id),
    storeName: storeNames.get(row.owner_id) ?? 'Vendedor',
    categoryId: String(row.taxonomy_node_id),
    categoryName: categoryNames.get(row.taxonomy_node_id),
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    variantId: defaultVariant ? String(defaultVariant.id) : undefined,
    hasOptions: variantRows.length > 1,
    createdAt: row.created_at,
  }
}

export function mapPublicationRowsToMarketplaceListings(
  publications: PublicationFeedRow[],
  variantsByListingId: Map<string, VariantFeedRow[]>,
  storeNames: StoreNameLookup,
  categoryNames: CategoryNameLookup,
): MarketplaceListing[] {
  return publications.map((row) => {
    const listingKey = row.legacy_listing_id ?? row.id
    const variantRows = variantsByListingId.get(listingKey) ?? []
    return mapPublicationRowToMarketplaceListing(row, variantRows, storeNames, categoryNames)
  })
}

export function mergeDiscoveryFeeds(
  primary: MarketplaceListing[],
  secondary: MarketplaceListing[],
): MarketplaceListing[] {
  const byId = new Map<string, MarketplaceListing>()
  for (const item of secondary) {
    byId.set(item.id, item)
  }
  for (const item of primary) {
    byId.set(item.id, item)
  }
  return Array.from(byId.values()).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bTime - aTime
  })
}
