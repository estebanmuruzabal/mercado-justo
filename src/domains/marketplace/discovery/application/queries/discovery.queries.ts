import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'
import { fetchMarketplaceListings } from '@/domains/marketplace/listings/application/queries/marketplace.queries'
import { getDiscoverySource } from '../../config/discovery-source'
import { mergeDiscoveryFeeds } from '../mappers/publication-to-discovery.mapper'
import {
  buildDiscoveryFeed,
  type BuildDiscoveryFeedOptions,
} from '../../projections/discovery-feed.projection'

export type DiscoveryFeedOptions = BuildDiscoveryFeedOptions

/** @deprecated Use buildDiscoveryFeed from projections — kept for import migration */
export async function fetchDiscoveryFeedFromPublication(
  options: DiscoveryFeedOptions = {},
): Promise<MarketplaceListing[]> {
  return buildDiscoveryFeed(options)
}

export async function fetchDiscoveryFeed(
  options: DiscoveryFeedOptions = {},
): Promise<MarketplaceListing[]> {
  const source = getDiscoverySource()

  if (source === 'listing') {
    return fetchMarketplaceListings(options)
  }

  const fromPublication = await buildDiscoveryFeed(options)

  if (source === 'publication') {
    if (fromPublication.length > 0) {
      return fromPublication
    }
    return fetchMarketplaceListings(options)
  }

  const fromListing = await fetchMarketplaceListings(options)
  return mergeDiscoveryFeeds(fromPublication, fromListing)
}

/** @deprecated Use fetchDiscoveryFeed — kept for gradual import migration */
export async function fetchMarketplaceListingsViaDiscovery(
  options: DiscoveryFeedOptions = {},
): Promise<MarketplaceListing[]> {
  return fetchDiscoveryFeed(options)
}
