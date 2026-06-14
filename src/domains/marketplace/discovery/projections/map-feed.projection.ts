import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'
import { buildDiscoveryFeed, type BuildDiscoveryFeedOptions } from './discovery-feed.projection'

export type BuildMapFeedOptions = BuildDiscoveryFeedOptions

export async function buildMapFeed(
  options: BuildMapFeedOptions = {},
): Promise<MarketplaceListing[]> {
  const feed = await buildDiscoveryFeed(options)
  return feed.filter((item) => item.latitude != null && item.longitude != null)
}
