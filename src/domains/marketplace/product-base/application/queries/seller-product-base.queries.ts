import { createClient } from '@/shared/database/supabase/server'

import type {
  SellerProductBaseAttributeDto,
  SellerProductBaseDetailDto,
  SellerProductBaseSummaryDto,
} from '../dto/seller-product-base.dto'
import type {
  ProductBaseImageStrategy,
  ProductBaseStatus,
  ProductBaseType,
} from '../../domain/product-base'
import type {
  ProductBaseAttributeType,
  ProductBaseAttributeValidation,
} from '../../domain/product-base-attribute'

const BASE_SELECT =
  'id, name, slug, description, category_id, subcategory_id, type, status, base_image_url, image_strategy'

const ATTRIBUTE_SELECT =
  'id, key, label, description, type, required, default_value, placeholder, options, validation, sort_order, is_visible, is_variant_dimension, allow_variant_pricing'

type ProductBaseSellerRow = {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string
  subcategory_id: string | null
  type: string
  status: string
  base_image_url: string | null
  image_strategy: string
}

type ProductBaseAttributeSellerRow = {
  id: string
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
  is_variant_dimension: boolean
  allow_variant_pricing: boolean
}

function mapBaseSummary(row: ProductBaseSellerRow): SellerProductBaseSummaryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type as ProductBaseType,
    status: row.status as ProductBaseStatus,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    baseImageUrl: row.base_image_url,
    imageStrategy: row.image_strategy as ProductBaseImageStrategy,
  }
}

function mapAttribute(row: ProductBaseAttributeSellerRow): SellerProductBaseAttributeDto {
  return {
    id: row.id,
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
    isVariantDimension: row.is_variant_dimension,
    allowVariantPricing: row.allow_variant_pricing,
  }
}

export async function listActiveProductBasesForSeller(input: {
  categoryId: string
  subcategoryId?: string | null
}): Promise<SellerProductBaseSummaryDto[]> {
  const supabase = await createClient()

  let query = supabase
    .from('product_base')
    .select(BASE_SELECT)
    .eq('status', 'ACTIVE')
    .eq('category_id', input.categoryId)
    .order('name', { ascending: true })

  if (input.subcategoryId) {
    query = query.eq('subcategory_id', input.subcategoryId)
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as ProductBaseSellerRow[]).map(mapBaseSummary)
}

export async function getProductBaseForListingForm(id: string): Promise<SellerProductBaseDetailDto | null> {
  const supabase = await createClient()

  const { data: baseRow, error: baseError } = await supabase
    .from('product_base')
    .select(BASE_SELECT)
    .eq('id', id)
    .eq('status', 'ACTIVE')
    .maybeSingle()

  if (baseError) throw baseError
  if (!baseRow) return null

  const { data: attributeRows, error: attrError } = await supabase
    .from('product_base_attribute')
    .select(ATTRIBUTE_SELECT)
    .eq('product_base_id', id)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  if (attrError) throw attrError

  return {
    ...mapBaseSummary(baseRow as ProductBaseSellerRow),
    description: (baseRow as ProductBaseSellerRow).description,
    attributes: ((attributeRows ?? []) as ProductBaseAttributeSellerRow[]).map(mapAttribute),
  }
}
