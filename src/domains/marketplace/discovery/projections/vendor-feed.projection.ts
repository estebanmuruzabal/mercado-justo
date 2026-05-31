import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'
import { buildDiscoveryFeed } from './discovery-feed.projection'

export type BuildVendorFeedOptions = {
  storeId: string
  listingTypes?: ListingType[]
  limit?: number
}

/**
 * TEMPORARY in-memory store filter.
 * Push owner/store filter into SQL query in discovery-feed.projection
 * before Vendor storefront migration completes.
 *
 * Risk at scale: reading 50k publications to return ~40 for one seller.
 * Target: add `ownerId` / `ownerType` to BuildDiscoveryFeedOptions and
 * `.eq('owner_id', storeId)` on publication query (v2).
 */
export async function buildVendorFeed(
  options: BuildVendorFeedOptions,
): Promise<MarketplaceListing[]> {
  const feed = await buildDiscoveryFeed({
    listingTypes: options.listingTypes,
    limit: options.limit ?? 200,
  })
  return feed.filter((item) => item.storeId === options.storeId)
}
