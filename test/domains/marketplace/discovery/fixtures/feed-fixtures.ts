import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'
import type { PublicationFeedRow } from '@/domains/marketplace/discovery/application/mappers/publication-to-discovery.mapper'

export const productPublicationRow: PublicationFeedRow = {
  id: 'pub-product-1',
  legacy_listing_id: 'listing-product-1',
  publication_type: 'product',
  title: 'Aceite de oliva',
  taxonomy_node_id: 'cat-1',
  owner_id: 'store-1',
  owner_type: 'store',
  latitude: -34.6,
  longitude: -58.4,
  created_at: '2026-01-15T10:00:00Z',
  attributes_json: { image: 'https://example.com/aceite.jpg' },
}

export const productListingFeedItem: MarketplaceListing = {
  id: 'listing-product-1',
  publicationId: 'pub-product-1',
  listingType: 'product',
  title: 'Aceite de oliva',
  price: 1200,
  image: 'https://example.com/aceite.jpg',
  storeId: 'store-1',
  storeName: 'Tienda Demo',
  categoryId: 'cat-1',
  categoryName: 'Alimentos',
  latitude: -34.6,
  longitude: -58.4,
  variantId: 'var-1',
  hasOptions: false,
  createdAt: '2026-01-15T10:00:00Z',
}

export const servicePublicationRow: PublicationFeedRow = {
  id: 'pub-service-1',
  legacy_listing_id: 'listing-service-1',
  publication_type: 'service',
  title: 'Plomería',
  taxonomy_node_id: 'cat-2',
  owner_id: 'store-2',
  owner_type: 'store',
  latitude: null,
  longitude: null,
  created_at: '2026-02-01T12:00:00Z',
  attributes_json: null,
}

export const propertyPublicationRow: PublicationFeedRow = {
  id: 'pub-property-1',
  legacy_listing_id: 'listing-property-1',
  publication_type: 'property',
  title: 'Depto 2 ambientes',
  taxonomy_node_id: 'cat-3',
  owner_id: 'store-3',
  owner_type: 'store',
  latitude: -34.58,
  longitude: -58.42,
  created_at: '2026-03-10T08:00:00Z',
  attributes_json: { image: 'https://example.com/depto.jpg' },
}
