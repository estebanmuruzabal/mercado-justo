import { createClient } from '@/lib/supabase/server'
import { buildOpsAlerts, type OpsAlert } from '@/lib/admin/engines/notification-engine'
import { type ShipmentStatus } from '@/lib/admin/types'

const OFFLINE_THRESHOLD_DAYS = 14

/**
 * Operational alert center: assembles raw platform signals and runs them
 * through the notification engine. All derivation lives in the engine; this
 * query only gathers data.
 */
export async function getOpsAlerts(): Promise<OpsAlert[]> {
  const supabase = await createClient()

  const offlineCutoff = new Date()
  offlineCutoff.setDate(offlineCutoff.getDate() - OFFLINE_THRESHOLD_DAYS)

  const [shipmentsRes, ordersRes, storesRes] = await Promise.all([
    supabase
      .from('shipment')
      .select('id, store_id, status, updated_at'),
    supabase
      .from('order')
      .select('id, seller_id, payment_status, created_at')
      .eq('payment_status', 'failed'),
    supabase.from('store').select('id, name, last_active_at, status'),
  ])

  const storeName = new Map<string, string>()
  const offlineVendors: { storeId: string; storeName: string; lastActiveAt: string | null }[] = []
  for (const s of (storesRes.data ?? []) as Array<{
    id: string
    name: string
    last_active_at: string | null
    status: string
  }>) {
    storeName.set(s.id, s.name)
    const last = s.last_active_at ? new Date(s.last_active_at) : null
    if (s.status === 'active' && (!last || last < offlineCutoff)) {
      offlineVendors.push({ storeId: s.id, storeName: s.name, lastActiveAt: s.last_active_at })
    }
  }

  const shipments = ((shipmentsRes.data ?? []) as Array<{
    id: string
    store_id: string
    status: ShipmentStatus
    updated_at: string
  }>).map((s) => ({
    id: s.id,
    status: s.status,
    storeName: storeName.get(s.store_id) ?? 'Vendor',
    updatedAt: s.updated_at,
  }))

  const failedPayments = ((ordersRes.data ?? []) as Array<{
    id: string
    seller_id: string
    created_at: string
  }>).map((o) => ({
    orderId: o.id,
    storeName: storeName.get(o.seller_id) ?? 'Vendor',
    createdAt: o.created_at,
  }))

  return buildOpsAlerts({
    shipments,
    failedPayments,
    offlineVendors,
    // Telegram error log is a Phase 2 data source; none wired yet.
    telegramErrors: [],
  })
}
