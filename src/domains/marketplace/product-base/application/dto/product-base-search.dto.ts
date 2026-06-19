import type { ProductBaseType } from '../../domain/product-base'

export type ProductBaseSearchResultDto = {
  id: string
  name: string
  image: string | null
  /** Full breadcrumb from root category to leaf (e.g. ["Frutas y Verduras", "Tomates"]). */
  taxonomyPath: string[]
  category: string
  subcategory: string | null
  categoryId: string
  subcategoryId: string | null
  slug: string
  type: ProductBaseType
  confidence?: number
}

export type ProductBaseIdentifyResultDto = ProductBaseSearchResultDto & {
  confidence: number
}
