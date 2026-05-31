import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  mapPublicationRowToMarketplaceListing,
  mergeDiscoveryFeeds,
} from '@/domains/marketplace/discovery/application/mappers/publication-to-discovery.mapper'
import {
  compareDiscoveryParity,
} from '@/domains/marketplace/discovery/application/parity/discovery-parity'
import {
  DISCOVERY_MIGRATION_PHASE,
  getDiscoverySource,
} from '@/domains/marketplace/discovery/config/discovery-source'
import {
  productListingFeedItem,
  productPublicationRow,
  propertyPublicationRow,
  servicePublicationRow,
} from './fixtures/feed-fixtures'

describe('mapPublicationRowToMarketplaceListing', () => {
  const storeNames = new Map([['store-1', 'Tienda Demo']])
  const categoryNames = new Map([['cat-1', 'Alimentos']])

  it('maps product publication without data loss', () => {
    const result = mapPublicationRowToMarketplaceListing(
      productPublicationRow,
      [
        {
          id: 'var-1',
          listing_id: 'listing-product-1',
          price: 1200,
          is_default: true,
          attributes_json: { name: 'Aceite de oliva', image: 'https://example.com/aceite.jpg' },
        },
      ],
      storeNames,
      categoryNames,
    )

    expect(result.id).toBe('listing-product-1')
    expect(result.publicationId).toBe('pub-product-1')
    expect(result.listingType).toBe('product')
    expect(result.title).toBe('Aceite de oliva')
    expect(result.price).toBe(1200)
    expect(result.image).toBe('https://example.com/aceite.jpg')
    expect(result.storeId).toBe('store-1')
    expect(result.categoryId).toBe('cat-1')
    expect(result.latitude).toBe(-34.6)
    expect(result.createdAt).toBe('2026-01-15T10:00:00Z')
  })

  it('maps service publication', () => {
    const result = mapPublicationRowToMarketplaceListing(
      servicePublicationRow,
      [],
      new Map([['store-2', 'Servicios SA']]),
      new Map([['cat-2', 'Servicios']]),
    )
    expect(result.listingType).toBe('service')
    expect(result.title).toBe('Plomería')
    expect(result.latitude).toBeNull()
  })

  it('maps property publication', () => {
    const result = mapPublicationRowToMarketplaceListing(
      propertyPublicationRow,
      [
        {
          id: 'var-p1',
          listing_id: 'listing-property-1',
          price: 250000,
          is_default: true,
          attributes_json: { image: 'https://example.com/depto.jpg' },
        },
      ],
      new Map([['store-3', 'Inmobiliaria']]),
      new Map([['cat-3', 'Propiedades']]),
    )
    expect(result.listingType).toBe('property')
    expect(result.price).toBe(250000)
    expect(result.image).toBe('https://example.com/depto.jpg')
  })
})

describe('mergeDiscoveryFeeds dedupe', () => {
  it('dedupes by legacy_listing_id with publication winning', () => {
    const merged = mergeDiscoveryFeeds(
      [{ ...productListingFeedItem, title: 'From Publication', price: 1200 }],
      [{ ...productListingFeedItem, title: 'From Listing', price: 999 }],
    )
    expect(merged).toHaveLength(1)
    expect(merged[0]?.title).toBe('From Publication')
    expect(merged[0]?.price).toBe(1200)
  })

  it('keeps listing-only orphans', () => {
    const listingOnly = { ...productListingFeedItem, id: 'orphan-listing' }
    const merged = mergeDiscoveryFeeds([], [listingOnly])
    expect(merged).toHaveLength(1)
    expect(merged[0]?.id).toBe('orphan-listing')
  })
})

describe('compareDiscoveryParity', () => {
  it('reports >= 99% parity when feeds match', () => {
    const report = compareDiscoveryParity(
      [productListingFeedItem],
      [productListingFeedItem],
    )
    expect(report.parityRatio).toBeGreaterThanOrEqual(0.99)
    expect(report.priceDiffs).toHaveLength(0)
    expect(report.imageDiffs).toHaveLength(0)
  })

  it('detects price and image diffs', () => {
    const report = compareDiscoveryParity(
      [{ ...productListingFeedItem, price: 1500, image: 'https://a.com/x.jpg' }],
      [{ ...productListingFeedItem, price: 1200, image: 'https://b.com/y.jpg' }],
    )
    expect(report.priceDiffs).toHaveLength(1)
    expect(report.imageDiffs).toHaveLength(1)
  })

  it('reports missing ids in each feed', () => {
    const report = compareDiscoveryParity(
      [productListingFeedItem],
      [{ ...productListingFeedItem, id: 'listing-only' }],
    )
    expect(report.missingInPublication).toContain('listing-only')
    expect(report.missingInListing).toContain('listing-product-1')
  })
})

describe('fetchDiscoveryFeed routing', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults to phase C publication', () => {
    vi.stubEnv('DISCOVERY_SOURCE', '')
    expect(getDiscoverySource()).toBe(DISCOVERY_MIGRATION_PHASE.C)
  })

  it('resolves phase A listing', () => {
    vi.stubEnv('DISCOVERY_SOURCE', 'listing')
    expect(getDiscoverySource()).toBe(DISCOVERY_MIGRATION_PHASE.A)
  })

  it('resolves phase B dual', () => {
    vi.stubEnv('DISCOVERY_SOURCE', 'dual')
    expect(getDiscoverySource()).toBe(DISCOVERY_MIGRATION_PHASE.B)
  })
})

describe('fetchDiscoveryFeedDual integration', () => {
  it('merges publication and listing feeds', async () => {
    vi.mock('@/domains/marketplace/discovery/projections/discovery-feed.projection', () => ({
      buildDiscoveryFeed: vi.fn().mockResolvedValue([
        { ...productListingFeedItem, title: 'Pub' },
      ]),
    }))
    vi.mock('@/domains/marketplace/listings/application/queries/marketplace.queries', () => ({
      fetchMarketplaceListings: vi.fn().mockResolvedValue([
        { ...productListingFeedItem, title: 'Listing' },
        { ...productListingFeedItem, id: 'extra-listing', title: 'Extra' },
      ]),
    }))

    const { fetchDiscoveryFeedDual } = await import(
      '@/domains/marketplace/discovery/application/queries/discovery.queries'
    )
    const merged = await fetchDiscoveryFeedDual()
    expect(merged).toHaveLength(2)
    expect(merged.find((i) => i.id === 'listing-product-1')?.title).toBe('Pub')
    expect(merged.find((i) => i.id === 'extra-listing')?.title).toBe('Extra')
  })
})
