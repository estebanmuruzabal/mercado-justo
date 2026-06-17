import { createAdminClient } from '@/shared/database/admin-client'

import type { ProductBaseDetailDto, ProductBaseSummaryDto } from '../dto/product-base.dto'
import {
  getProductBaseByIdAdmin,
  listProductBasesAdmin,
  type ProductBaseFilters,
} from '../../infrastructure/product-base.repository'
import type { ProductBaseAttribute } from '../../domain/product-base-attribute'

export type { ProductBaseFilters }

function mapAttributeToDto(attr: ProductBaseAttribute): ProductBaseDetailDto['attributes'][number] {
  return {
    id: attr.id,
    key: attr.key,
    label: attr.label,
    description: attr.description,
    type: attr.type,
    required: attr.required,
    defaultValue: attr.defaultValue,
    placeholder: attr.placeholder,
    options: attr.options,
    validation: attr.validation,
    sortOrder: attr.sortOrder,
    isVisible: attr.isVisible,
    isFilterable: attr.isFilterable,
    isSearchable: attr.isSearchable,
    isVariantDimension: attr.isVariantDimension,
    allowVariantPricing: attr.allowVariantPricing,
    scoreContribution: attr.scoreContribution,
  }
}

/** PostgREST puts `.in()` values in the URL; chunk to avoid 414 URI too long. */
const ATTRIBUTE_COUNT_IN_CHUNK_SIZE = 80

async function countAttributesByBaseIds(baseIds: string[]): Promise<Map<string, number>> {
  if (baseIds.length === 0) return new Map()

  const admin = createAdminClient()
  const counts = new Map<string, number>()

  for (let offset = 0; offset < baseIds.length; offset += ATTRIBUTE_COUNT_IN_CHUNK_SIZE) {
    const chunk = baseIds.slice(offset, offset + ATTRIBUTE_COUNT_IN_CHUNK_SIZE)
    const { data, error } = await admin
      .from('product_base_attribute')
      .select('product_base_id')
      .in('product_base_id', chunk)

    if (error) throw error

    for (const row of (data ?? []) as Array<{ product_base_id: string }>) {
      counts.set(row.product_base_id, (counts.get(row.product_base_id) ?? 0) + 1)
    }
  }

  return counts
}

export async function listProductBasesForAdmin(
  filters: ProductBaseFilters = {},
): Promise<ProductBaseSummaryDto[]> {
  const admin = createAdminClient()
  const rows = await listProductBasesAdmin(admin, filters)
  const includeAttributeCount = filters.includeAttributeCount !== false
  const counts = includeAttributeCount
    ? await countAttributesByBaseIds(rows.map((row) => row.id))
    : new Map<string, number>()

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    status: row.status,
    source: row.source,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    subcategoryId: row.subcategoryId,
    subcategoryName: row.subcategoryName,
    attributeCount: counts.get(row.id) ?? 0,
    updatedAt: row.updatedAt,
  }))
}

export async function getProductBaseDetailForAdmin(id: string): Promise<ProductBaseDetailDto | null> {
  const admin = createAdminClient()
  const row = await getProductBaseByIdAdmin(admin, id)
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    subcategoryId: row.subcategoryId,
    subcategoryName: row.subcategoryName,
    type: row.type,
    status: row.status,
    source: row.source,
    baseImageUrl: row.baseImageUrl,
    imageStrategy: row.imageStrategy,
    attributes: row.attributes.map(mapAttributeToDto),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
