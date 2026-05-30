import { createClient } from '@/lib/supabase/server'
import type { CreateStoreInput, Store } from '@/types/store'
import { slugify } from '@/lib/vendor/slug'
import {
  getStoreByUserIdQuery,
  hasStoreQuery,
  mapStoreRow,
  type StoreDbClient,
} from '@/server/queries/store.queries'

function buildStorePayload(data: CreateStoreInput) {
  return {
    name: data.name.trim(),
    slug: data.slug ?? null,
    bio: data.bio?.trim() || null,
    banner_url: data.bannerUrl ?? null,
    logo_url: data.logoUrl ?? null,
    allow_followers: data.allowFollowers ?? true,
    whatsapp_number: data.whatsappNumber ?? null,
    show_whatsapp: data.showWhatsapp ?? true,
    instagram: data.instagram ?? null,
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

/**
 * Ensure a slug is unique across stores, appending a numeric suffix on
 * collisions. `excludeStoreId` lets a store keep/regenerate its own slug.
 */
export async function generateUniqueSlug(
  desired: string,
  excludeStoreId?: string,
): Promise<string> {
  const supabase = await createClient()
  const base = slugify(desired) || 'tienda'

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    let query = supabase.from('store').select('id').eq('slug', candidate)
    if (excludeStoreId) query = query.neq('id', excludeStoreId)
    const { data, error } = await query.maybeSingle()
    if (error) throw error
    if (!data) return candidate
  }

  return `${base}-${Date.now().toString(36)}`
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

