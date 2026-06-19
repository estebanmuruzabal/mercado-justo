import { createClient } from '@/shared/database/supabase/server'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'

import type { ProductBaseSearchResultDto } from '../dto/product-base-search.dto'
import { productBaseTypesForListingType } from '../../domain/product-base-listing-type-filter'
import type { ProductBaseType } from '../../domain/product-base'

const BASE_SELECT =
  'id, name, slug, description, category_id, subcategory_id, type, status, base_image_url'

type ProductBaseSearchRow = {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string
  subcategory_id: string | null
  type: string
  status: string
  base_image_url: string | null
}

type CategoryGraphRow = {
  id: string
  name: string
  parent_id: string | null
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

function scoreMatch(row: ProductBaseSearchRow, query: string, attrMatched: boolean): number {
  const q = normalizeQuery(query)
  const name = row.name.toLowerCase()
  const slug = row.slug.toLowerCase()
  const description = (row.description ?? '').toLowerCase()

  if (name === q) return 100
  if (name.startsWith(q)) return 90
  if (name.includes(q)) return 80
  if (slug.includes(q)) return 60
  if (description.includes(q)) return 40
  if (attrMatched) return 50
  return 0
}

async function loadCategoryGraph(): Promise<Map<string, CategoryGraphRow>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('category').select('id, name, parent_id')
  if (error) throw error

  return new Map(((data ?? []) as CategoryGraphRow[]).map((row) => [row.id, row]))
}

function buildTaxonomyPath(leafCategoryId: string, categoryGraph: Map<string, CategoryGraphRow>): string[] {
  const path: string[] = []
  let current = categoryGraph.get(leafCategoryId) ?? null

  while (current) {
    path.unshift(current.name)
    if (!current.parent_id) break
    current = categoryGraph.get(current.parent_id) ?? null
  }

  return path.length > 0 ? path : ['—']
}

function mapToResult(
  row: ProductBaseSearchRow,
  categoryGraph: Map<string, CategoryGraphRow>,
  confidence?: number,
): ProductBaseSearchResultDto {
  const leafCategoryId = row.subcategory_id ?? row.category_id
  const taxonomyPath = buildTaxonomyPath(leafCategoryId, categoryGraph)

  return {
    id: row.id,
    name: row.name,
    image: row.base_image_url,
    taxonomyPath,
    category: taxonomyPath[0] ?? '—',
    subcategory: taxonomyPath.length > 1 ? (taxonomyPath[taxonomyPath.length - 1] ?? null) : null,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    slug: row.slug,
    type: row.type as ProductBaseType,
    ...(confidence !== undefined ? { confidence } : {}),
  }
}

export async function searchProductBases(input: {
  query: string
  listingType?: ListingType
  limit?: number
}): Promise<ProductBaseSearchResultDto[]> {
  const query = input.query.trim()
  if (query.length < 2) return []

  const limit = input.limit ?? 20
  const supabase = await createClient()
  const pattern = `%${escapeIlike(query)}%`

  const allowedTypes = input.listingType ? productBaseTypesForListingType(input.listingType) : null

  let baseQuery = supabase
    .from('product_base')
    .select(BASE_SELECT)
    .eq('status', 'ACTIVE')
    .or(`name.ilike.${pattern},slug.ilike.${pattern},description.ilike.${pattern}`)
    .limit(50)

  if (allowedTypes && allowedTypes.length > 0) {
    baseQuery = baseQuery.in('type', allowedTypes)
  }

  const { data: nameMatches, error: nameError } = await baseQuery
  if (nameError) throw nameError

  const { data: attrRows, error: attrError } = await supabase
    .from('product_base_attribute')
    .select('product_base_id')
    .eq('is_searchable', true)
    .or(`label.ilike.${pattern},key.ilike.${pattern}`)
    .limit(50)

  if (attrError) throw attrError

  const attrBaseIds = [...new Set((attrRows ?? []).map((row) => (row as { product_base_id: string }).product_base_id))]

  let attrMatches: ProductBaseSearchRow[] = []
  if (attrBaseIds.length > 0) {
    let attrBaseQuery = supabase.from('product_base').select(BASE_SELECT).eq('status', 'ACTIVE').in('id', attrBaseIds)

    if (allowedTypes && allowedTypes.length > 0) {
      attrBaseQuery = attrBaseQuery.in('type', allowedTypes)
    }

    const { data, error } = await attrBaseQuery
    if (error) throw error
    attrMatches = (data ?? []) as ProductBaseSearchRow[]
  }

  const attrMatchedIds = new Set(attrMatches.map((row) => row.id))
  const merged = new Map<string, { row: ProductBaseSearchRow; attrMatched: boolean }>()

  for (const row of (nameMatches ?? []) as ProductBaseSearchRow[]) {
    merged.set(row.id, { row, attrMatched: attrMatchedIds.has(row.id) })
  }

  for (const row of attrMatches) {
    if (!merged.has(row.id)) {
      merged.set(row.id, { row, attrMatched: true })
    }
  }

  const ranked = [...merged.values()]
    .map(({ row, attrMatched }) => ({
      row,
      score: scoreMatch(row, query, attrMatched),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name))
    .slice(0, limit)
    .map((item) => item.row)

  const categoryGraph = await loadCategoryGraph()

  return ranked.map((row) => mapToResult(row, categoryGraph))
}
