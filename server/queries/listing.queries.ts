import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import type { CategoryOption, Listing } from '@/types/listing'

type ListingRow = Database['public']['Tables']['listing']['Row']
type CategoryRow = Database['public']['Tables']['category']['Row']

export function mapListingRow(row: ListingRow): Listing {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    condition: row.condition as Listing['condition'],
    categoryId: row.category_id,
    storeId: row.store_id,
    createdAt: row.created_at,
  }
}

export async function fetchListingsByStore(userId: string): Promise<Listing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listing')
    .select('*')
    .eq('store_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(mapListingRow)
}

export async function fetchCategories(): Promise<CategoryOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('category')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: Pick<CategoryRow, 'id' | 'name'>) => ({
    id: row.id,
    name: row.name,
  }))
}

