import type { ListingType } from '@/domains/marketplace/listings/domain/listing'

import type { CategoryRow } from '../types'

export function listingTypeLabel(listingType: ListingType): string {
  if (listingType === 'product') return 'Product'
  if (listingType === 'service') return 'Service'
  return 'Property'
}

export function buildCategoryPath(categoryId: string, byId: Map<string, CategoryRow>): string[] {
  const path: string[] = []
  let current = byId.get(categoryId) ?? null

  while (current) {
    path.push(current.id)
    if (!current.parent_id) break
    current = byId.get(current.parent_id) ?? null
  }

  return path.length > 0 ? path.reverse() : []
}

export function productBaseCategoryPath(categoryId: string, subcategoryId: string | null): string[] {
  return subcategoryId != null ? [categoryId, subcategoryId] : [categoryId]
}
