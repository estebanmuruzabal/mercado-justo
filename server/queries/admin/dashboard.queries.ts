import { createClient } from '@/lib/supabase/server'
import { isActiveDelivery } from '@/lib/admin/engines/fulfillment-engine'
import { aggregateCarbonScore } from '@/lib/admin/engines/sustainability-engine'
import { type ShipmentStatus } from '@/lib/admin/types'

export type AdminDashboardKpis = {
  totalSales: number
  pendingOrders: number
  activeDeliveries: number
  activeVendors: number
  newUsers: number
  ordersToday: number
  openIssues: number
  carbonScore: number
}

function startOfToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

/**
 * Global platform KPIs for the admin dashboard. Reads run under the staff
 * session (admin-read RLS grants cross-vendor visibility).
 *
 * Counts use head-only count queries; sums/carbon fetch minimal columns and
 * aggregate in TS via the engines. For very large datasets these can be moved
 * to SQL aggregate RPCs later without changing the call site.
 */
export async function getAdminDashboardKpis(): Promise<AdminDashboardKpis> {
  const supabase = await createClient()

  const [
    orderTotals,
    shipments,
    activeVendorsRes,
    newUsersRes,
    ordersTodayRes,
    openReportsRes,
  ] = await Promise.all([
    supabase.from('order').select('total'),
    supabase.from('shipment').select('status, distance_km, delivery_method'),
    supabase.from('store').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('user').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(7)),
    supabase.from('order').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday()),
    supabase
      .from('moderation_report')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'reviewing']),
  ])

  const totalSales = (orderTotals.data ?? []).reduce(
    (sum, row) => sum + Number((row as { total: number | null }).total ?? 0),
    0,
  )

  const shipmentRows = (shipments.data ?? []) as {
    status: ShipmentStatus
    distance_km: number | null
    delivery_method: string | null
  }[]

  const pendingOrders = shipmentRows.filter((s) => s.status === 'pending').length
  const activeDeliveries = shipmentRows.filter((s) => isActiveDelivery(s.status)).length
  const incidents = shipmentRows.filter((s) => s.status === 'incident').length
  const carbonScore = aggregateCarbonScore(
    shipmentRows.map((s) => ({ distanceKm: s.distance_km, deliveryMethod: s.delivery_method })),
  )

  return {
    totalSales,
    pendingOrders,
    activeDeliveries,
    activeVendors: activeVendorsRes.count ?? 0,
    newUsers: newUsersRes.count ?? 0,
    ordersToday: ordersTodayRes.count ?? 0,
    openIssues: (openReportsRes.count ?? 0) + incidents,
    carbonScore,
  }
}
