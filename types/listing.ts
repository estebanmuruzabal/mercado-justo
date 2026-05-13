export type ListingCondition = 'new' | 'used'

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

