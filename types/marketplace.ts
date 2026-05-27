import type { ListingType } from '@/lib/listing'

export type MarketplaceListing = {
  id: string
  listingType: ListingType
  title: string
  price: number
  image: string | null
  storeId: string
  storeName: string
  categoryId: string
  categoryName?: string
  latitude: number | null
  longitude: number | null
  variantId?: string
  hasOptions?: boolean
  createdAt?: string
  deliveryAvailable?: boolean
  pickupAvailable?: boolean
}

export type MarketplaceListingWithDistance = MarketplaceListing & {
  distanceKm: number | null
  distanceLabel: string | null
}
