import { createClient } from '@/lib/supabase/server'
import { aggregateCarbonScore } from '@/lib/admin/engines/sustainability-engine'
import { isTerminalStatus } from '@/lib/admin/engines/fulfillment-engine'
import { type ShipmentStatus } from '@/lib/admin/types'

export type AdminAnalyticsSummary = {
  gmv: number
  orderCount: number
  averageOrderValue: number
  uniqueBuyers: number
  deliveredShipments: number
  totalShipments: number
  deliveryEfficiency: number
  averageDistanceKm: number
  carbonScore: number
}

/**
 * Analytics base summary (GMV, retention proxy, delivery efficiency, average
 * distance, environmental impact). Computed from orders + shipments; deeper
 * cohorts/time-series are Phase 2.
 */
export async function getAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  const supabase = await createClient()

  const [ordersRes, shipmentsRes] = await Promise.all([
    supabase.from('order').select('total, buyer_id'),
    supabase.from('shipment').select('status, distance_km, delivery_method'),
  ])

  const orders = (ordersRes.data ?? []) as { total: number | null; buyer_id: string }[]
  const gmv = orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
  const orderCount = orders.length
  const uniqueBuyers = new Set(orders.map((o) => o.buyer_id)).size

  const shipments = (shipmentsRes.data ?? []) as {
    status: ShipmentStatus
    distance_km: number | null
    delivery_method: string | null
  }[]
  const totalShipments = shipments.length
  const deliveredShipments = shipments.filter((s) => s.status === 'delivered').length
  const terminal = shipments.filter((s) => isTerminalStatus(s.status)).length

  const distances = shipments
    .map((s) => s.distance_km)
    .filter((d): d is number => typeof d === 'number' && Number.isFinite(d))
  const averageDistanceKm = distances.length
    ? Math.round((distances.reduce((a, b) => a + b, 0) / distances.length) * 10) / 10
    : 0

  return {
    gmv,
    orderCount,
    averageOrderValue: orderCount ? Math.round(gmv / orderCount) : 0,
    uniqueBuyers,
    deliveredShipments,
    totalShipments,
    deliveryEfficiency: terminal ? Math.round((deliveredShipments / terminal) * 100) : 0,
    averageDistanceKm,
    carbonScore: aggregateCarbonScore(
      shipments.map((s) => ({ distanceKm: s.distance_km, deliveryMethod: s.delivery_method })),
    ),
  }
}
