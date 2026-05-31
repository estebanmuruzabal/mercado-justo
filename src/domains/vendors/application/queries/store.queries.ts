import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/shared/types/supabase'
import type { Store, StoreMode, StorePlan } from '@/domains/vendors/domain/store'

export type StoreDbClient = SupabaseClient<Database>
type StoreRow = Database['public']['Tables']['store']['Row']

export function mapStoreRow(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? null,
    bio: row.bio ?? null,
    bannerUrl: row.banner_url ?? null,
    logoUrl: row.logo_url ?? null,
    allowFollowers: row.allow_followers ?? true,
    whatsappNumber: row.whatsapp_number ?? null,
    showWhatsapp: row.show_whatsapp ?? true,
    followerCount: row.follower_count ?? 0,
    reviewCount: row.review_count ?? 0,
    ratingAvg: row.rating_avg === null ? 0 : Number(row.rating_avg),
    instagram: row.instagram,
    address: row.address,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    mode: row.mode as StoreMode,
    plan: row.plan as StorePlan,
    productLimit: row.product_limit,
    termsAccepted: row.terms_accepted,
    termsAcceptedAt: row.terms_accepted_at,
    createdAt: row.created_at,
  }
}

export async function getStoreByUserIdQuery(
  supabase: StoreDbClient,
  userId: string
): Promise<Store | null> {
  const { data, error } = await supabase
    .from('store')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapStoreRow(data) : null
}

export async function hasStoreQuery(
  supabase: StoreDbClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('store')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data)
}

