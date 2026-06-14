import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { CharacteristicMap } from '@/domains/marketplace/listings/domain/product'
import type { SellerProductBaseDetailDto } from '@/domains/marketplace/product-base/application/dto/seller-product-base.dto'

export type ModalStep = 1 | 2 | 3

export type DraftFormState = {
  listingId: string | null
  listingType: ListingType | null
  categoryId: string | null
  subcategoryId: string | null
  categoryPath: string[]
  productBaseId: string | null
  productBase: SellerProductBaseDetailDto | null

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

  // Variants toggle
  enableVariants: boolean

  // Simple mode (no variants)
  simplePrice: number | null
  simpleSku: string | null

  // Used for legacy publishing (derived from variants when enableVariants=true)
  price: number | null
  status: 'draft' | 'published'
}

