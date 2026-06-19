import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { CharacteristicMap } from '@/domains/marketplace/listings/domain/product'
import type { SellerProductBaseDetailDto } from '@/domains/marketplace/product-base/application/dto/seller-product-base.dto'

import type { PendingListingImage } from '@/domains/marketplace/listings/presentation/utils/pending-listing-image'

export type CategoryRow = {
  id: string
  name: string
  parent_id: string | null
  is_visible: boolean
}

export type SelectedProductBaseSummary = {
  id: string
  name: string
  image: string | null
  taxonomyPath: string[]
  category: string
  subcategory: string | null
  confidence?: number
}

export type ModalStep = 1 | 2 | 3

export type DraftFormState = {
  listingId: string | null
  listingType: ListingType | null
  categoryId: string | null
  subcategoryId: string | null
  categoryPath: string[]
  productBaseId: string | null
  productBase: SellerProductBaseDetailDto | null
  selectedProductBase: SelectedProductBaseSummary | null

  // Base fields
  title: string
  description: string
  condition: 'new' | 'used'
  stock: number
  latitude: number | null
  longitude: number | null

  // Category-specific
  characteristics: CharacteristicMap
  images: string[]
  /** Client-only images not yet uploaded to Storage (e.g. from photo identification). */
  pendingListingImages: PendingListingImage[]

  // Variants toggle
  enableVariants: boolean

  // Simple mode (no variants)
  simplePrice: number | null
  simpleSku: string | null

  // Used for legacy publishing (derived from variants when enableVariants=true)
  price: number | null
  status: 'draft' | 'published'
}

