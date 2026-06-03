export const PRODUCT_BASE_TYPES = [
  'PRODUCT',
  'SERVICE',
  'PROPERTY',
  'EXPERIENCE',
  'DITTOBOT',
  'DITTO_RECIPE',
] as const

export type ProductBaseType = (typeof PRODUCT_BASE_TYPES)[number]

export const PRODUCT_BASE_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE'] as const

export type ProductBaseStatus = (typeof PRODUCT_BASE_STATUSES)[number]

export const PRODUCT_BASE_IMAGE_STRATEGIES = [
  'BASE_ONLY',
  'BASE_OR_LISTING',
  'LISTING_REQUIRED',
] as const

export type ProductBaseImageStrategy = (typeof PRODUCT_BASE_IMAGE_STRATEGIES)[number]

/** Future listing/publication type mapping (R3.1+). */
export const PRODUCT_BASE_TYPE_TO_LISTING_TYPE: Record<ProductBaseType, string> = {
  PRODUCT: 'product',
  SERVICE: 'service',
  PROPERTY: 'property',
  EXPERIENCE: 'experience',
  DITTOBOT: 'dittobot',
  DITTO_RECIPE: 'recipe',
}

export type ProductBase = {
  id: string
  name: string
  slug: string
  description: string | null
  categoryId: string
  subcategoryId: string | null
  type: ProductBaseType
  status: ProductBaseStatus
  baseImageUrl: string | null
  imageStrategy: ProductBaseImageStrategy
  createdAt: string
  updatedAt: string
}

export function slugifyProductBaseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
