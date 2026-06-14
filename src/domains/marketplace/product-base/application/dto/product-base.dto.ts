import type {
  ProductBaseImageStrategy,
  ProductBaseStatus,
  ProductBaseType,
} from '../../domain/product-base'
import type {
  ProductBaseAttributeType,
  ProductBaseAttributeValidation,
} from '../../domain/product-base-attribute'

export type ProductBaseAttributeDto = {
  /** Stable React key for editor rows; stripped before persist. */
  clientKey?: string
  id?: string
  key: string
  label: string
  description?: string | null
  type: ProductBaseAttributeType
  required: boolean
  defaultValue?: unknown
  placeholder?: string | null
  options?: string[] | null
  validation?: ProductBaseAttributeValidation | null
  sortOrder: number
  isVisible: boolean
  isFilterable: boolean
  isSearchable: boolean
  isVariantDimension: boolean
  allowVariantPricing: boolean
  scoreContribution?: Record<string, number> | null
}

export type ProductBaseSummaryDto = {
  id: string
  name: string
  slug: string
  type: ProductBaseType
  status: ProductBaseStatus
  categoryId: string
  categoryName: string | null
  subcategoryId: string | null
  subcategoryName: string | null
  attributeCount: number
  updatedAt: string
}

export type ProductBaseDetailDto = {
  id: string
  name: string
  slug: string
  description: string | null
  categoryId: string
  categoryName: string | null
  subcategoryId: string | null
  subcategoryName: string | null
  type: ProductBaseType
  status: ProductBaseStatus
  baseImageUrl: string | null
  imageStrategy: ProductBaseImageStrategy
  attributes: ProductBaseAttributeDto[]
  createdAt: string
  updatedAt: string
}

export type ProductBaseFormDto = {
  name: string
  slug: string
  description?: string | null
  categoryId: string
  subcategoryId?: string | null
  type: ProductBaseType
  baseImageUrl?: string | null
  imageStrategy: ProductBaseImageStrategy
  attributes: ProductBaseAttributeDto[]
}
