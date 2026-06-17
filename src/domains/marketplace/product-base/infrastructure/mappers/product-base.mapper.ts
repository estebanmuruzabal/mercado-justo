import type {
  ProductBase,
  ProductBaseImageStrategy,
  ProductBaseSource,
  ProductBaseStatus,
  ProductBaseType,
} from '../../domain/product-base'
import type {
  ProductBaseAttribute,
  ProductBaseAttributeType,
  ProductBaseAttributeValidation,
} from '../../domain/product-base-attribute'

type ProductBaseRow = {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string
  subcategory_id: string | null
  type: string
  status: string
  source: string
  base_image_url: string | null
  image_strategy: string
  created_at: string
  updated_at: string
  category?: { name: string | null } | null
  subcategory?: { name: string | null } | null
}

type ProductBaseAttributeRow = {
  id: string
  product_base_id: string
  key: string
  label: string
  description: string | null
  type: string
  required: boolean
  default_value: unknown
  placeholder: string | null
  options: unknown
  validation: unknown
  sort_order: number
  is_visible: boolean
  is_filterable: boolean
  is_searchable: boolean
  is_variant_dimension: boolean
  allow_variant_pricing: boolean
  score_contribution: unknown
  created_at: string
  updated_at: string
}

export function mapProductBaseRow(row: ProductBaseRow): ProductBase {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    type: row.type as ProductBaseType,
    status: row.status as ProductBaseStatus,
    source: row.source as ProductBaseSource,
    baseImageUrl: row.base_image_url,
    imageStrategy: row.image_strategy as ProductBaseImageStrategy,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapProductBaseAttributeRow(row: ProductBaseAttributeRow): ProductBaseAttribute {
  return {
    id: row.id,
    productBaseId: row.product_base_id,
    key: row.key,
    label: row.label,
    description: row.description,
    type: row.type as ProductBaseAttributeType,
    required: row.required,
    defaultValue: row.default_value ?? null,
    placeholder: row.placeholder,
    options: Array.isArray(row.options) ? (row.options as string[]) : null,
    validation: (row.validation as ProductBaseAttributeValidation | null) ?? null,
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    isFilterable: row.is_filterable,
    isSearchable: row.is_searchable,
    isVariantDimension: row.is_variant_dimension,
    allowVariantPricing: row.allow_variant_pricing,
    scoreContribution: (row.score_contribution as Record<string, number> | null) ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type ProductBaseAdminRow = ProductBase & {
  categoryName: string | null
  subcategoryName: string | null
}

export function mapProductBaseAdminRow(row: ProductBaseRow): ProductBaseAdminRow {
  return {
    ...mapProductBaseRow(row),
    categoryName: row.category?.name ?? null,
    subcategoryName: row.subcategory?.name ?? null,
  }
}

export type { ProductBaseRow, ProductBaseAttributeRow }
