import { createClient } from '@/lib/supabase/server'
import type { CreateListingInput, Listing } from '@/types/listing'
import { getStoreByUserId } from '@/server/services/store.service'
import { fetchListingsByStore, mapListingRow } from '@/server/queries/listing.queries'

async function getListingTypeForCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string
) {
  const { data, error } = (await supabase
    .from('category' as never)
    .select('listing_type' as never)
    .eq('id', categoryId)
    .maybeSingle()) as {
    data: { listing_type?: string } | null
    error: { message: string } | null
  }

  if (error) throw new Error(error.message)
  if (!data?.listing_type) throw new Error('Invalid category.')
  return data.listing_type
}

async function buildListingPayload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: CreateListingInput,
  storeId: string
) {
  const listing_type = await getListingTypeForCategory(supabase, data.categoryId)
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    price: data.price,
    stock: data.stock,
    condition: data.condition,
    category_id: data.categoryId,
    store_id: storeId,
    status: 'published',
    listing_type,
  }
}

export async function createListing(
  userId: string,
  data: CreateListingInput
): Promise<Listing> {
  const store = await getStoreByUserId(userId)

  if (!store) {
    throw new Error('Debés activar el modo vendedor antes de crear publicaciones.')
  }

  const currentListings = await fetchListingsByStore(userId)

  if (currentListings.length >= store.productLimit) {
    throw new Error('Tu store alcanzó el límite de productos disponible.')
  }

  const supabase = await createClient()
  const { data: insertedListing, error } = await supabase
    .from('listing')
    .insert(await buildListingPayload(supabase, data, store.id) as never)
    .select('*')
    .single()

  if (error || !insertedListing) {
    throw error ?? new Error('No se pudo crear la publicación.')
  }

  return mapListingRow(insertedListing)
}

export async function getListingsByStore(userId: string): Promise<Listing[]> {
  const store = await getStoreByUserId(userId)

  if (!store) {
    throw new Error('Debés activar el modo vendedor antes de ver publicaciones.')
  }

  return fetchListingsByStore(userId)
}

