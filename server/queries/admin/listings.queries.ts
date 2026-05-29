import { createClient } from '@/lib/supabase/server'
import { type ListingModerationStatus } from '@/lib/admin/types'

export type AdminListingRow = {
  id: string
  title: string
  description: string
  price: number
  status: string
  listingType: string
  moderationStatus: ListingModerationStatus
  moderationReason: string | null
  vendorId: string
  vendorName: string
  categoryName: string | null
  reportCount: number
  createdAt: string
}

export type AdminListingsData = {
  listings: AdminListingRow[]
  vendors: { id: string; name: string }[]
}

/** All listings with moderation state + report counts for the moderation queue. */
export async function listListingsForAdmin(): Promise<AdminListingsData> {
  const supabase = await createClient()

  const [listingsRes, storesRes, categoriesRes, reportsRes] = await Promise.all([
    supabase
      .from('listing')
      .select(
        'id, title, description, price, status, listing_type, moderation_status, moderation_reason, store_id, category_id, created_at',
      )
      .order('created_at', { ascending: false }),
    supabase.from('store').select('id, name'),
    supabase.from('category').select('id, name'),
    supabase
      .from('moderation_report')
      .select('entity_id, status')
      .eq('entity_type', 'listing')
      .in('status', ['open', 'reviewing']),
  ])

  const storeName = new Map<string, string>()
  for (const s of (storesRes.data ?? []) as { id: string; name: string }[]) {
    storeName.set(s.id, s.name)
  }

  const categoryName = new Map<string, string>()
  for (const c of (categoriesRes.data ?? []) as { id: string; name: string }[]) {
    categoryName.set(c.id, c.name)
  }

  const reportsByListing = new Map<string, number>()
  for (const r of (reportsRes.data ?? []) as { entity_id: string }[]) {
    reportsByListing.set(r.entity_id, (reportsByListing.get(r.entity_id) ?? 0) + 1)
  }

  const listings: AdminListingRow[] = ((listingsRes.data ?? []) as Array<{
    id: string
    title: string
    description: string
    price: number | null
    status: string
    listing_type: string
    moderation_status: string
    moderation_reason: string | null
    store_id: string
    category_id: string | null
    created_at: string
  }>).map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    price: Number(l.price ?? 0),
    status: l.status,
    listingType: l.listing_type,
    moderationStatus: (l.moderation_status as ListingModerationStatus) ?? 'pending',
    moderationReason: l.moderation_reason,
    vendorId: l.store_id,
    vendorName: storeName.get(l.store_id) ?? 'Vendor',
    categoryName: l.category_id ? categoryName.get(l.category_id) ?? null : null,
    reportCount: reportsByListing.get(l.id) ?? 0,
    createdAt: l.created_at,
  }))

  const vendors = [...storeName.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { listings, vendors }
}
