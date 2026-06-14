import { createClient } from '@/shared/database/supabase/server'
import type { TaxonomyNode } from '../../domain/taxonomy-node'

type TaxonomyRow = {
  id: string
  parent_id: string | null
  name: string
  slug: string
  allowed_types: string[]
  is_visible: boolean
  sort_order: number
  legacy_category_id: string | null
}

function mapRow(row: TaxonomyRow): TaxonomyNode {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    slug: row.slug,
    allowedTypes: row.allowed_types ?? ['product'],
    isVisible: row.is_visible,
    sortOrder: row.sort_order,
    legacyCategoryId: row.legacy_category_id,
  }
}

export async function fetchTaxonomyNodes(): Promise<TaxonomyNode[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('taxonomy_node')
    .select('id, parent_id, name, slug, allowed_types, is_visible, sort_order, legacy_category_id')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return fetchLegacyCategoriesAsTaxonomy(supabase)
  }
  return (data ?? []).map((row) => mapRow(row as TaxonomyRow))
}

async function fetchLegacyCategoriesAsTaxonomy(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<TaxonomyNode[]> {
  const { data, error } = await supabase
    .from('category')
    .select('id, parent_id, name, listing_type, is_visible')
    .eq('is_visible', true)

  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    parentId: row.parent_id as string | null,
    name: row.name as string,
    slug: String(row.name).toLowerCase().replace(/\s+/g, '-'),
    allowedTypes: [row.listing_type as string],
    isVisible: row.is_visible as boolean,
    sortOrder: 0,
    legacyCategoryId: row.id as string,
  }))
}
