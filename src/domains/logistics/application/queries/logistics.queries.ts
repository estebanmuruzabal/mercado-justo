import { createClient } from '@/shared/database/supabase/server'
import { isActiveDelivery } from '@/domains/logistics/domain/engines/fulfillment-engine'
import {
  type FulfillmentBatchRow,
  type FulfillmentMethodCode,
  type FulfillmentMethodKind,
  type FulfillmentMethodProvider,
  type FulfillmentBatchingCandidate,
  type FulfillmentRequestRow,
  type LogisticsDashboardStats,
  type PickupWindowRow,
  type ScheduledWindow,
  type ShipmentStatus,
} from '@/domains/logistics/domain/types'

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

/** Legacy shipment-backed overview kept for compatibility during the migration. */
export async function getLegacyLogisticsOverview(): Promise<LogisticsOverview> {
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

const ACTIVE_REQUEST_STATUSES: readonly ShipmentStatus[] = [
  'preparing',
  'ready_for_pickup',
  'in_transit',
]

type FulfillmentMethodDbRow = {
  code: FulfillmentMethodCode
  label: string
  kind: FulfillmentMethodKind
  provider: FulfillmentMethodProvider
  sort_order: number
  is_active: boolean
}

type PickupWindowDbRow = {
  id: string
  vendor_id: string | null
  code: string
  label: string
  day_of_week: number | null
  start_time: string
  end_time: string
  timezone: string
  sort_order: number
  is_active: boolean
}

type FulfillmentBatchDbRow = {
  id: string
  code: string
  status: FulfillmentBatchRow['status']
  scheduled_window: ScheduledWindow | null
  created_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

type FulfillmentRequestDbRow = {
  id: string
  shipment_id: string
  order_id: string
  vendor_id: string
  buyer_id: string
  method_code: FulfillmentMethodCode
  status: ShipmentStatus
  pickup_window_id: string | null
  scheduled_window: ScheduledWindow | null
  pickup_address: string | null
  delivery_address: string | null
  assigned_operator_id: string | null
  batch_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

type StoreDbRow = {
  id: string
  name: string | null
}

function buildWindowLabel(window: ScheduledWindow | null): string {
  if (!window?.start) return 'Sin ventana'
  if (!window.end) return `${window.start}`
  return `${window.start} — ${window.end}`
}

function isBatchingRequest(method: FulfillmentMethodDbRow | undefined, request: FulfillmentRequestRow): boolean {
  return Boolean(method && method.kind === 'delivery' && request.batchId == null && isActiveDelivery(request.status))
}

async function loadFulfillmentRequests(activeOnly: boolean) {
  const supabase = await createClient()

  const requestQuery = supabase
    .from('fulfillment_requests')
    .select(
      'id,shipment_id,order_id,vendor_id,buyer_id,method_code,status,pickup_window_id,scheduled_window,pickup_address,delivery_address,assigned_operator_id,batch_id,notes,created_at,updated_at',
    )
    .order('updated_at', { ascending: false })

  if (activeOnly) {
    requestQuery.in('status', [...ACTIVE_REQUEST_STATUSES])
  }

  const { data: requestRows, error: requestError } = await requestQuery
  if (requestError) throw requestError

  const typedRequests = (requestRows ?? []) as FulfillmentRequestDbRow[]
  const vendorIds = [...new Set(typedRequests.map((request) => request.vendor_id).filter(Boolean))]
  const methodCodes = [...new Set(typedRequests.map((request) => request.method_code).filter(Boolean))]
  const pickupWindowIds = [...new Set(typedRequests.map((request) => request.pickup_window_id).filter(Boolean))] as string[]
  const batchIds = [...new Set(typedRequests.map((request) => request.batch_id).filter(Boolean))] as string[]

  const [storesRes, methodsRes, windowsRes, batchesRes] = await Promise.all([
    vendorIds.length
      ? supabase.from('store').select('id,name').in('id', vendorIds)
      : Promise.resolve({ data: [] as StoreDbRow[], error: null }),
    methodCodes.length
      ? supabase
          .from('fulfillment_methods')
          .select('code,label,kind,provider,sort_order,is_active')
          .in('code', methodCodes)
      : Promise.resolve({ data: [] as FulfillmentMethodDbRow[], error: null }),
    pickupWindowIds.length
      ? supabase
          .from('pickup_windows')
          .select('id,code,label,start_time,end_time,timezone,sort_order,is_active')
          .in('id', pickupWindowIds)
      : Promise.resolve({ data: [] as PickupWindowDbRow[], error: null }),
    batchIds.length
      ? supabase
          .from('fulfillment_batches')
          .select('id,code,status,scheduled_window,created_by,notes,created_at,updated_at')
          .in('id', batchIds)
      : Promise.resolve({ data: [] as FulfillmentBatchDbRow[], error: null }),
  ])

  if (storesRes.error) throw storesRes.error
  if (methodsRes.error) throw methodsRes.error
  if (windowsRes.error) throw windowsRes.error
  if (batchesRes.error) throw batchesRes.error

  const storeNames = new Map<string, string>()
  for (const row of (storesRes.data ?? []) as StoreDbRow[]) {
    storeNames.set(row.id, row.name?.trim() || 'Vendedor')
  }

  const methodsByCode = new Map<string, FulfillmentMethodDbRow>()
  for (const row of (methodsRes.data ?? []) as FulfillmentMethodDbRow[]) {
    methodsByCode.set(row.code, row)
  }

  const windowsById = new Map<string, PickupWindowDbRow>()
  for (const row of (windowsRes.data ?? []) as PickupWindowDbRow[]) {
    windowsById.set(row.id, row)
  }

  const batchesById = new Map<string, FulfillmentBatchDbRow>()
  for (const row of (batchesRes.data ?? []) as FulfillmentBatchDbRow[]) {
    batchesById.set(row.id, row)
  }

  const requests: FulfillmentRequestRow[] = typedRequests.map((row) => {
    const method = methodsByCode.get(row.method_code)
    const pickupWindow = row.pickup_window_id ? windowsById.get(row.pickup_window_id) : null
    const batch = row.batch_id ? batchesById.get(row.batch_id) : null

    return {
      id: row.id,
      shipmentId: row.shipment_id,
      orderId: row.order_id,
      vendorId: row.vendor_id,
      vendorName: storeNames.get(row.vendor_id) ?? 'Vendedor',
      buyerId: row.buyer_id,
      methodCode: row.method_code,
      methodLabel: method?.label ?? row.method_code,
      methodKind: method?.kind ?? 'delivery',
      methodProvider: method?.provider ?? 'seller',
      status: row.status,
      pickupWindowId: row.pickup_window_id,
      pickupWindowLabel: pickupWindow?.label ?? (row.pickup_window_id ? 'Ventana configurada' : null),
      scheduledWindow: row.scheduled_window,
      pickupAddress: row.pickup_address,
      deliveryAddress: row.delivery_address,
      assignedOperatorId: row.assigned_operator_id,
      batchId: row.batch_id,
      batchCode: batch?.code ?? null,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })

  return { requests, methodsByCode }
}

export async function getLogisticsDashboardStats(): Promise<LogisticsDashboardStats> {
  const { requests, methodsByCode } = await loadFulfillmentRequests(false)
  const pickupWindowsConfigured = (await getPickupWindows()).length
  const batchingCandidates = (await getBatchingCandidates()).length

  let activeDeliveries = 0
  let totalMercadoJusto = 0
  let totalDeliveryPropio = 0
  let totalPickup = 0

  for (const request of requests) {
    const method = methodsByCode.get(request.methodCode)
    if (method?.provider === 'dittovan') totalMercadoJusto += 1
    if (method?.kind === 'delivery' && method?.provider === 'seller') totalDeliveryPropio += 1
    if (method?.kind === 'pickup') totalPickup += 1
    if (method && isActiveDelivery(request.status) && method.kind === 'delivery') activeDeliveries += 1
  }

  return {
    activeDeliveries,
    totalMercadoJusto,
    totalDeliveryPropio,
    totalPickup,
    pickupWindowsConfigured,
    batchingCandidates,
  }
}

export async function getPickupWindows(): Promise<PickupWindowRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pickup_windows')
    .select('id,vendor_id,code,label,day_of_week,start_time,end_time,timezone,sort_order,is_active')
    .is('vendor_id', null)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true })

  if (error) throw error

  return ((data ?? []) as PickupWindowDbRow[]).map((row) => ({
    id: row.id,
    vendorId: row.vendor_id,
    code: row.code,
    label: row.label,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    timezone: row.timezone,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }))
}

export async function getActiveFulfillmentRequests(): Promise<FulfillmentRequestRow[]> {
  const { requests } = await loadFulfillmentRequests(true)
  return requests.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.createdAt.localeCompare(a.createdAt))
}

export async function getBatchingCandidates(): Promise<FulfillmentBatchingCandidate[]> {
  const { requests, methodsByCode } = await loadFulfillmentRequests(true)

  const groups = new Map<string, FulfillmentBatchingCandidate>()

  for (const request of requests) {
    const method = methodsByCode.get(request.methodCode)
    if (!isBatchingRequest(method, request)) continue
    if (!request.scheduledWindow?.start || !request.scheduledWindow?.end) continue

    const key = [
      request.scheduledWindow.date ?? 'no-date',
      request.scheduledWindow.start,
      request.scheduledWindow.end,
      method?.provider ?? 'seller',
    ].join('|')

    const current = groups.get(key) ?? {
      key,
      label: buildWindowLabel(request.scheduledWindow),
      methodProvider: method?.provider ?? 'seller',
      requestCount: 0,
      vendorCount: 0,
      vendorNames: [],
      requestIds: [],
      scheduledWindow: request.scheduledWindow,
    }

    current.requestCount += 1
    current.requestIds.push(request.id)
    if (!current.vendorNames.includes(request.vendorName)) {
      current.vendorNames.push(request.vendorName)
    }
    current.vendorCount = current.vendorNames.length
    groups.set(key, current)
  }

  return [...groups.values()]
    .filter((group) => group.vendorCount > 1 || group.requestCount > 1)
    .sort((a, b) => b.requestCount - a.requestCount || a.label.localeCompare(b.label))
}

export async function getLogisticsOverview(): Promise<LogisticsOverview> {
  const [stats, activeRequests, , batchingCandidates] = await Promise.all([
    getLogisticsDashboardStats(),
    getActiveFulfillmentRequests(),
    getPickupWindows(),
    getBatchingCandidates(),
  ])

  return {
    activeShipments: activeRequests.map((request) => ({
      id: request.id,
      vendorName: request.vendorName,
      status: request.status,
      deliveryMethod:
        request.methodCode === 'pickup_seller' || request.methodCode === 'pickup_dittovan'
          ? 'pickup'
          : request.methodCode === 'delivery_seller'
            ? 'own_delivery'
            : request.methodCode === 'delivery_dittovan'
              ? 'mj_delivery'
              : null,
      scheduledWindow: request.scheduledWindow,
    })),
    methodCounts: {
      pickup: stats.totalPickup,
      own_delivery: stats.totalDeliveryPropio,
      mj_delivery: stats.totalMercadoJusto,
      unset: 0,
    },
    batchableCount: batchingCandidates.length || stats.batchingCandidates,
  }
}
