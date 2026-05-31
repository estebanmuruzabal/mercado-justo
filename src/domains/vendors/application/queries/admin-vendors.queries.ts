import { createClient } from '@/shared/database/supabase/server'
import { type VendorStatus } from '@/domains/logistics/domain/types'

export type AdminVendorRow = {
  id: string
  name: string
  logoUrl: string | null
  slug: string | null
  bio: string | null
  status: VendorStatus
  isFeatured: boolean
  rating: number
  reviewCount: number
  salesCount: number
  salesTotal: number
  problems: number
  lastActiveAt: string | null
  createdAt: string
  suspensionReason: string | null
}

/**
 * All vendors with denormalized ops metrics for the admin Vendors table.
 * Sales + problems are aggregated in TS from orders/shipments; can move to a
 * SQL view/RPC if the vendor count grows large.
 */
export async function listVendorsForAdmin(): Promise<AdminVendorRow[]> {
  const supabase = await createClient()

  const [storesRes, ordersRes, shipmentsRes, reportsRes] = await Promise.all([
    supabase
      .from('store')
      .select(
        'id, name, logo_url, slug, bio, status, is_featured, rating_avg, review_count, created_at, last_active_at, suspension_reason',
      )
      .order('created_at', { ascending: false }),
    supabase.from('order').select('seller_id, total'),
    supabase.from('shipment').select('store_id, status'),
    supabase
      .from('moderation_report')
      .select('entity_id, entity_type, status')
      .eq('entity_type', 'vendor')
      .in('status', ['open', 'reviewing']),
  ])

  const stores = (storesRes.data ?? []) as Array<{
    id: string
    name: string
    logo_url: string | null
    slug: string | null
    bio: string | null
    status: string
    is_featured: boolean | null
    rating_avg: number | null
    review_count: number | null
    created_at: string
    last_active_at: string | null
    suspension_reason: string | null
  }>

  const salesByStore = new Map<string, { count: number; total: number }>()
  for (const o of (ordersRes.data ?? []) as { seller_id: string; total: number | null }[]) {
    const agg = salesByStore.get(o.seller_id) ?? { count: 0, total: 0 }
    agg.count += 1
    agg.total += Number(o.total ?? 0)
    salesByStore.set(o.seller_id, agg)
  }

  const problemsByStore = new Map<string, number>()
  for (const s of (shipmentsRes.data ?? []) as { store_id: string; status: string }[]) {
    if (s.status === 'incident') {
      problemsByStore.set(s.store_id, (problemsByStore.get(s.store_id) ?? 0) + 1)
    }
  }
  for (const r of (reportsRes.data ?? []) as { entity_id: string }[]) {
    problemsByStore.set(r.entity_id, (problemsByStore.get(r.entity_id) ?? 0) + 1)
  }

  return stores.map((store) => {
    const sales = salesByStore.get(store.id) ?? { count: 0, total: 0 }
    return {
      id: store.id,
      name: store.name,
      logoUrl: store.logo_url,
      slug: store.slug,
      bio: store.bio,
      status: (store.status as VendorStatus) ?? 'active',
      isFeatured: store.is_featured ?? false,
      rating: Number(store.rating_avg ?? 0),
      reviewCount: store.review_count ?? 0,
      salesCount: sales.count,
      salesTotal: sales.total,
      problems: problemsByStore.get(store.id) ?? 0,
      lastActiveAt: store.last_active_at,
      createdAt: store.created_at,
      suspensionReason: store.suspension_reason,
    }
  })
}
