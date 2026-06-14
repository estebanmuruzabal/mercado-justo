export const PRODUCT_BASE_ATTRIBUTE_TYPES = [
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'BOOLEAN',
  'DATE',
  'SELECT',
  'MULTISELECT',
  'IMAGE',
  'FILE',
  'LOCATION',
  'EMAIL',
  'PHONE',
  'URL',
  'CURRENCY',
  'PERCENTAGE',
] as const

export type ProductBaseAttributeType = (typeof PRODUCT_BASE_ATTRIBUTE_TYPES)[number]

export type ProductBaseAttributeValidation = {
  min?: number
  max?: number
  step?: number
  minLength?: number
  maxLength?: number
  regex?: string
}

export type ProductBaseAttribute = {
  id: string
  productBaseId: string
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
  isFilterable: boolean
  isSearchable: boolean
  isVariantDimension: boolean
  allowVariantPricing: boolean
  scoreContribution: Record<string, number> | null
  createdAt: string
  updatedAt: string
}

export type ProductBaseAttributeInput = Omit<
  ProductBaseAttribute,
  'id' | 'productBaseId' | 'createdAt' | 'updatedAt'
> & { id?: string }
