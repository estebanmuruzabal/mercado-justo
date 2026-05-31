/**
 * Discovery subdomain — browse, search, filters, map feed.
 * Public read path: publication (canonical) with listing Strangler fallback.
 */
export {
  getDiscoverySource,
  DISCOVERY_MIGRATION_PHASE,
  DISCOVERY_SOURCE_SUNSET,
  DISCOVERY_SOURCE_CANONICAL,
  type DiscoverySource,
  type DiscoveryMigrationPhase,
} from './config/discovery-source'
export {
  fetchDiscoveryFeed,
  fetchDiscoveryFeedDual,
  fetchDiscoveryFeedFromPublication,
  fetchMarketplaceListingsViaDiscovery,
  type DiscoveryFeedOptions,
} from './application/queries/discovery.queries'
export {
  buildDiscoveryFeed,
  buildMapFeed,
  buildVendorFeed,
  type BuildDiscoveryFeedOptions,
  type BuildMapFeedOptions,
  type BuildVendorFeedOptions,
} from './projections'

export {
  fetchMarketplaceCategories,
  fetchPublicStores,
} from '@/domains/marketplace/listings/application/queries/marketplace.queries'

export { fetchTaxonomyNodes } from '@/domains/marketplace/taxonomy/application/queries/taxonomy.queries'
export { fetchPublicationById } from '@/domains/marketplace/publication/application/queries/publication.queries'
