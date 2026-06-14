import type { ListingType } from '@/domains/marketplace/listings/domain/listing'

export type MarketplaceListing = {
  id: string
  /** Canonical publication id when sourced from discovery/publication feed */
  publicationId?: string
  listingType: ListingType
  title: string
  price: number
  stock?: number | null
  image: string | null
  storeId: string
  storeName: string
  categoryId: string
  categoryName?: string
  latitude: number | null
  longitude: number | null
  variantId?: string
  variantName?: string
  hasOptions?: boolean
  createdAt?: string
  deliveryAvailable?: boolean
  pickupAvailable?: boolean
  /** From listing characteristics / variant attributes when present */
  tags?: string[]
}

export type MarketplaceListingWithDistance = MarketplaceListing & {
  distanceKm: number | null
  distanceLabel: string | null
}
