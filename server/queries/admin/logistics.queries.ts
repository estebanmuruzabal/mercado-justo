import { createClient } from '@/lib/supabase/server'
import { isActiveDelivery } from '@/lib/admin/engines/fulfillment-engine'
import { type ShipmentStatus } from '@/lib/admin/types'

export type ActiveShipment = {
  id: string
  vendorName: string
  status: ShipmentStatus
  deliveryMethod: string | null
  scheduledWindow: { date?: string; start?: string; end?: string } | null
}

export type LogisticsOverview = {
  activeShipments: ActiveShipment[]
  methodCounts: { pickup: number; own_delivery: number; mj_delivery: number; unset: number }
  batchableCount: number
}

/** Read-only logistics overview (active shipments, method mix, batching readiness). */
export async function getLogisticsOverview(): Promise<LogisticsOverview> {
  const supabase = await createClient()

  const [shipmentsRes, storesRes] = await Promise.all([
    supabase
      .from('shipment')
      .select('id, store_id, status, delivery_method, scheduled_window'),
    supabase.from('store').select('id, name'),
  ])

  const storeName = new Map<string, string>()
  for (const s of (storesRes.data ?? []) as { id: string; name: string }[]) {
    storeName.set(s.id, s.name)
  }

  const methodCounts = { pickup: 0, own_delivery: 0, mj_delivery: 0, unset: 0 }
  const activeShipments: ActiveShipment[] = []

  for (const s of (shipmentsRes.data ?? []) as Array<{
    id: string
    store_id: string
    status: ShipmentStatus
    delivery_method: string | null
    scheduled_window: ActiveShipment['scheduledWindow']
  }>) {
    const key = (s.delivery_method ?? 'unset') as keyof typeof methodCounts
    if (key in methodCounts) methodCounts[key] += 1
    else methodCounts.unset += 1

    if (isActiveDelivery(s.status)) {
      activeShipments.push({
        id: s.id,
        vendorName: storeName.get(s.store_id) ?? 'Vendor',
        status: s.status,
        deliveryMethod: s.delivery_method,
        scheduledWindow: s.scheduled_window,
      })
    }
  }

  // Batchable = active MJ/own deliveries (multi-vendor grouping candidates).
  const batchableCount = activeShipments.filter(
    (s) => s.deliveryMethod === 'mj_delivery' || s.deliveryMethod === 'own_delivery',
  ).length

  return { activeShipments, methodCounts, batchableCount }
}
