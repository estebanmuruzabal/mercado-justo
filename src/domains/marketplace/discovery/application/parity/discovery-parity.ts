import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'
import { DISCOVERY_MIGRATION_PHASE, getDiscoverySource } from '../../config/discovery-source'

export type DiscoveryParityReport = {
  publicationCount: number
  listingCount: number
  mergedCount: number
  missingInPublication: string[]
  missingInListing: string[]
  priceDiffs: Array<{ id: string; publication: number; listing: number }>
  imageDiffs: string[]
  parityRatio: number
}

function feedById(feed: MarketplaceListing[]): Map<string, MarketplaceListing> {
  return new Map(feed.map((item) => [item.id, item]))
}

/** @internal Compare publication vs listing feeds for Phase B validation. */
export function compareDiscoveryParity(
  publicationFeed: MarketplaceListing[],
  listingFeed: MarketplaceListing[],
): DiscoveryParityReport {
  const pubById = feedById(publicationFeed)
  const listingById = feedById(listingFeed)

  const pubIds = new Set(pubById.keys())
  const listingIds = new Set(listingById.keys())

  const missingInPublication = [...listingIds].filter((id) => !pubIds.has(id))
  const missingInListing = [...pubIds].filter((id) => !listingIds.has(id))

  const sharedIds = [...pubIds].filter((id) => listingIds.has(id))
  const priceDiffs: DiscoveryParityReport['priceDiffs'] = []
  const imageDiffs: string[] = []

  for (const id of sharedIds) {
    const pub = pubById.get(id)!
    const listing = listingById.get(id)!
    if (pub.price !== listing.price) {
      priceDiffs.push({ id, publication: pub.price, listing: listing.price })
    }
    if (pub.image !== listing.image) {
      imageDiffs.push(id)
    }
  }

  const denominator = Math.max(publicationFeed.length, listingFeed.length, 1)
  const parityRatio = sharedIds.length / denominator

  return {
    publicationCount: publicationFeed.length,
    listingCount: listingFeed.length,
    mergedCount: new Set([...pubIds, ...listingIds]).size,
    missingInPublication,
    missingInListing,
    priceDiffs,
    imageDiffs,
    parityRatio,
  }
}

/** Logs parity report in development/test when DISCOVERY_SOURCE=dual (Phase B). */
export function logDiscoveryParityIfEnabled(
  publicationFeed: MarketplaceListing[],
  listingFeed: MarketplaceListing[],
  mergedFeed: MarketplaceListing[],
): void {
  const env = process.env.NODE_ENV
  if (env !== 'development' && env !== 'test') return
  if (getDiscoverySource() !== DISCOVERY_MIGRATION_PHASE.B) return

  const report = compareDiscoveryParity(publicationFeed, listingFeed)

  console.info('[discovery:parity]', {
    phase: 'B',
    actualMergedCount: mergedFeed.length,
    ...report,
  })
}
