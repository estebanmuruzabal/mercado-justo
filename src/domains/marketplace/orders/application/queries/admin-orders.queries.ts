import { createClient } from '@/shared/database/supabase/server'
import { deriveOrderLogisticStatus } from '@/domains/logistics/domain/engines/fulfillment-engine'
import { getCarbonLevel } from '@/domains/logistics/domain/engines/sustainability-engine'
import { type CarbonLevel, type ShipmentStatus } from '@/domains/logistics/domain/types'

export type AdminShipmentRow = {
  id: string
  vendorId: string
  vendorName: string
  status: ShipmentStatus
  deliveryMethod: string | null
  scheduledWindow: { date?: string; start?: string; end?: string } | null
  distanceKm: number | null
  carbonLevel: CarbonLevel
  updatedAt: string
}

export type AdminOrderRow = {
  id: string
  createdAt: string
  total: number
  paymentStatus: string
  buyerName: string
  logisticStatus: ShipmentStatus
  vendorNames: string[]
  shipments: AdminShipmentRow[]
}

export type AdminOrdersData = {
  orders: AdminOrderRow[]
  vendors: { id: string; name: string }[]
}

export async function listOrdersForAdmin(): Promise<AdminOrdersData> {
  const supabase = await createClient()

  const [ordersRes, shipmentsRes, storesRes, usersRes] = await Promise.all([
    supabase
      .from('order')
      .select('id, buyer_id, total, payment_status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('shipment')
      .select('id, order_id, store_id, status, delivery_method, scheduled_window, distance_km, carbon_level, updated_at'),
    supabase.from('store').select('id, name'),
    supabase.from('user').select('id, full_name, email'),
  ])

  const storeName = new Map<string, string>()
  for (const s of (storesRes.data ?? []) as { id: string; name: string }[]) {
    storeName.set(s.id, s.name)
  }

  const buyerName = new Map<string, string>()
  for (const u of (usersRes.data ?? []) as {
    id: string
    full_name: string | null
    email: string | null
  }[]) {
    buyerName.set(u.id, u.full_name || u.email || 'Comprador')
  }

  const shipmentsByOrder = new Map<string, AdminShipmentRow[]>()
  for (const s of (shipmentsRes.data ?? []) as Array<{
    id: string
    order_id: string
    store_id: string
    status: ShipmentStatus
    delivery_method: string | null
    scheduled_window: AdminShipmentRow['scheduledWindow']
    distance_km: number | null
    carbon_level: string | null
    updated_at: string
  }>) {
    const row: AdminShipmentRow = {
      id: s.id,
      vendorId: s.store_id,
      vendorName: storeName.get(s.store_id) ?? 'Vendor',
      status: s.status,
      deliveryMethod: s.delivery_method,
      scheduledWindow: s.scheduled_window,
      distanceKm: s.distance_km,
      carbonLevel: (s.carbon_level as CarbonLevel) ?? getCarbonLevel(s.distance_km),
      updatedAt: s.updated_at,
    }
    const list = shipmentsByOrder.get(s.order_id) ?? []
    list.push(row)
    shipmentsByOrder.set(s.order_id, list)
  }

  const orders: AdminOrderRow[] = ((ordersRes.data ?? []) as Array<{
    id: string
    buyer_id: string
    total: number | null
    payment_status: string
    created_at: string
  }>).map((o) => {
    const shipments = shipmentsByOrder.get(o.id) ?? []
    return {
      id: o.id,
      createdAt: o.created_at,
      total: Number(o.total ?? 0),
      paymentStatus: o.payment_status,
      buyerName: buyerName.get(o.buyer_id) ?? 'Comprador',
      logisticStatus: deriveOrderLogisticStatus(shipments.map((s) => s.status)),
      vendorNames: [...new Set(shipments.map((s) => s.vendorName))],
      shipments,
    }
  })

  const vendors = [...storeName.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { orders, vendors }
}
