import { createClient } from '@/lib/supabase/server'
import type { CreateStoreInput, Store } from '@/types/store'
import {
  getStoreByUserIdQuery,
  hasStoreQuery,
  mapStoreRow,
  type StoreDbClient,
} from '@/server/queries/store.queries'

function buildStorePayload(data: CreateStoreInput) {
  return {
    name: data.name.trim(),
    address: data.address?.trim() || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    mode: data.mode ?? 'online',
    plan: 'free' as const,
    product_limit: 10,
    terms_accepted: true,
    terms_accepted_at: new Date().toISOString(),
  }
}

export async function createStore(
  userId: string,
  data: CreateStoreInput
): Promise<Store> {
  const supabase = await createClient()
  const storeExists = await hasStoreQuery(supabase as unknown as StoreDbClient, userId)

  if (storeExists) {
    throw new Error('El usuario ya tiene un store activo.')
  }

  const { data: insertedStore, error } = await supabase
    .from('store')
    .insert({
      id: userId,
      ...buildStorePayload(data),
    } as never)
    .select('*')
    .single()

  if (error || !insertedStore) {
    throw error ?? new Error('No se pudo crear el store.')
  }

  return mapStoreRow(insertedStore)
}

export async function getStoreByUserId(
  userId: string
): Promise<Store | null> {
  const supabase = await createClient()
  return getStoreByUserIdQuery(supabase as unknown as StoreDbClient, userId)
}

export async function hasStore(userId: string): Promise<boolean> {
  const supabase = await createClient()
  return hasStoreQuery(supabase as unknown as StoreDbClient, userId)
}

