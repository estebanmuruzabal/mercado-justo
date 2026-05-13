import { createClient } from '@/lib/supabase/server'
import type { CreateListingInput, Listing } from '@/types/listing'
import { getStoreByUserId } from '@/server/services/store.service'
import { fetchListingsByStore, mapListingRow } from '@/server/queries/listing.queries'

function buildListingPayload(data: CreateListingInput, storeId: string) {
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    price: data.price,
    stock: data.stock,
    condition: data.condition,
    category_id: data.categoryId,
    store_id: storeId,
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
    .insert(buildListingPayload(data, store.id))
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

