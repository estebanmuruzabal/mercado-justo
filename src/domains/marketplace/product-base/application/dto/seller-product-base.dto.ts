import type {
  ProductBaseImageStrategy,
  ProductBaseStatus,
  ProductBaseType,
} from '../../domain/product-base'
import type {
  ProductBaseAttributeType,
  ProductBaseAttributeValidation,
} from '../../domain/product-base-attribute'

export type SellerProductBaseAttributeDto = {
  id: string
  key: string
  label: string
  description: string | null
  type: ProductBaseAttributeType
  required: boolean
  defaultValue: unknown
  placeholder: string | null
  options: string[] | null
  validation: ProductBaseAttributeValidation | null
  sortOrder: number
  isVisible: boolean
  isVariantDimension: boolean
  allowVariantPricing: boolean
}

export type SellerProductBaseSummaryDto = {
  id: string
  name: string
  slug: string
  type: ProductBaseType
  status: ProductBaseStatus
  categoryId: string
  subcategoryId: string | null
  baseImageUrl: string | null
  imageStrategy: ProductBaseImageStrategy
}

export type SellerProductBaseDetailDto = SellerProductBaseSummaryDto & {
  description: string | null
  attributes: SellerProductBaseAttributeDto[]
}
