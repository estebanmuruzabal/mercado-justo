export type ListingCondition = 'new' | 'used'

export type ListingStatus = 'draft' | 'published'

export type ListingType = import('@/lib/listing').ListingType

export interface CategoryOption {
  id: string
  name: string
}

export interface Listing {
  id: string
  title: string
  description: string
  price: number
  stock: number
  condition: ListingCondition
  categoryId: string
  storeId: string
  listingType?: ListingType
  status?: ListingStatus
  characteristics?: Record<string, unknown>
  createdAt: string
}

export interface CreateListingInput {
  title: string
  description: string
  price: number
  stock: number
  condition: ListingCondition
  categoryId: string
}

