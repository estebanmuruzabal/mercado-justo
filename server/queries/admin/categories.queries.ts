import { createClient } from '@/lib/supabase/server'
import type { ListingType } from '@/lib/listing'

export type AdminCategoryRow = {
  id: string
  name: string
  parentId: string | null
  isVisible: boolean
  listingType: ListingType
  createdAt: string
}

type CategoryDbRow = {
  id: string
  name: string
  parent_id: string | null
  is_visible: boolean
  listing_type: string
  created_at: string
}

function mapRow(row: CategoryDbRow): AdminCategoryRow {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    isVisible: row.is_visible,
    listingType: row.listing_type as ListingType,
    createdAt: row.created_at,
  }
}

export async function listCategoriesForAdmin(): Promise<AdminCategoryRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('category')
    .select('id, name, parent_id, is_visible, listing_type, created_at')
    .order('name', { ascending: true })

  if (error) throw error

  return ((data ?? []) as CategoryDbRow[]).map(mapRow)
}

export async function getCategoryById(id: string): Promise<AdminCategoryRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('category')
    .select('id, name, parent_id, is_visible, listing_type, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapRow(data as CategoryDbRow) : null
}
