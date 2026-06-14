'use client'

import { useEffect, useMemo, useState } from 'react'

import { ChevronRight } from 'lucide-react'

import { createClient } from '@/shared/database/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { SHIPMENT_STATUS_PRESENTATION } from '@/shared/utils/admin-status-presentation'
import { cn } from '@/shared/utils/utils'
import type { ShipmentStatus } from '@/domains/logistics/domain/types'

type OrderRow = {
  id: string
  seller_id: string
  status: string
  payment_status: string
  subtotal: number
  total: number
  created_at: string
  vendorName: string
}

type OrderItemRow = {
  order_id: string
  quantity: number
  title_snapshot: string
  price_snapshot: number
}

type ShipmentRow = {
  order_id: string
  status: ShipmentStatus
  scheduled_window: { date?: string; start?: string; end?: string } | null
  updated_at: string
}

type SalesFilterId = 'today' | 'upcoming' | 'in_transit' | 'finalized'

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function toDateKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function isSameDay(a: string, b: string) {
  return toDateKey(a) === toDateKey(b)
}

function getShipmentDate(shipment: ShipmentRow, fallbackDate: string) {
  return shipment.scheduled_window?.date ?? fallbackDate
}

export function SalesTab({ storeId }: { storeId: string }) {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [itemsByOrderId, setItemsByOrderId] = useState<Map<string, OrderItemRow[]>>(new Map())
  const [shipmentsByOrderId, setShipmentsByOrderId] = useState<Map<string, ShipmentRow[]>>(new Map())
  const [activeFilter, setActiveFilter] = useState<SalesFilterId>('today')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: ordersRows, error: ordersError } = await supabase
        .from('order')
        .select('id,status,payment_status,subtotal,total,created_at,seller_id')
        .eq('seller_id', storeId)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      const typedOrders: OrderRow[] = (ordersRows ?? []).map((r: unknown) => {
        const row = r as {
          id: unknown
          seller_id: unknown
          status: unknown
          payment_status: unknown
          subtotal: unknown
          total: unknown
          created_at: unknown
        }

        return {
          id: String(row.id),
          seller_id: String(row.seller_id ?? ''),
          status: String((row.status as string | null) ?? 'pending'),
          payment_status: String((row.payment_status as string | null) ?? 'unpaid'),
          subtotal: Number((row.subtotal as number | null) ?? 0),
          total: Number((row.total as number | null) ?? 0),
          created_at: String(row.created_at ?? ''),
          vendorName: '',
        }
      })

      const orderIds = typedOrders.map((o) => o.id)
      let items: OrderItemRow[] = []
      let shipments: ShipmentRow[] = []

      if (orderIds.length) {
        const [itemsResult, shipmentsResult] = await Promise.all([
          supabase
            .from('order_item')
            .select('order_id,quantity,title_snapshot,price_snapshot')
            .in('order_id', orderIds),
          supabase
            .from('shipment')
            .select('order_id,status,scheduled_window,updated_at')
            .in('order_id', orderIds),
        ])

        if (itemsResult.error) throw itemsResult.error
        if (shipmentsResult.error) throw shipmentsResult.error

        items = (itemsResult.data ?? []).map((it: unknown) => {
          const row = it as {
            order_id: unknown
            quantity: unknown
            title_snapshot: unknown
            price_snapshot: unknown
          }

          return {
            order_id: String(row.order_id),
            quantity: Number(row.quantity ?? 0),
            title_snapshot: String(row.title_snapshot ?? ''),
            price_snapshot: Number(row.price_snapshot ?? 0),
          }
        })

        shipments = (shipmentsResult.data ?? []).map((s: unknown) => {
          const row = s as {
            order_id: unknown
            status: unknown
            scheduled_window: unknown
            updated_at: unknown
          }

          const scheduledWindow =
            row.scheduled_window && typeof row.scheduled_window === 'object'
              ? (row.scheduled_window as ShipmentRow['scheduled_window'])
              : null

          return {
            order_id: String(row.order_id),
            status: String((row.status as string | null) ?? 'pending') as ShipmentStatus,
            scheduled_window: scheduledWindow,
            updated_at: String(row.updated_at ?? ''),
          }
        })
      }

      const itemsMap = new Map<string, OrderItemRow[]>()
      for (const item of items) {
        const key = String(item.order_id)
        const prev = itemsMap.get(key) ?? []
        prev.push(item)
        itemsMap.set(key, prev)
      }

      const shipmentsMap = new Map<string, ShipmentRow[]>()
      for (const shipment of shipments) {
        const key = String(shipment.order_id)
        const prev = shipmentsMap.get(key) ?? []
        prev.push(shipment)
        shipmentsMap.set(key, prev)
      }

      const sellerIds = [...new Set(typedOrders.map((o) => o.seller_id).filter(Boolean))]
      const { data: storeRows, error: storeError } = sellerIds.length
        ? await supabase.from('store').select('id,name').in('id', sellerIds)
        : { data: [] as Array<{ id: string; name: string | null }> }

      if (storeError) throw storeError

      const storeNames = new Map(
        (storeRows ?? []).map((row) => [String(row.id), row.name?.trim() || 'Vendedor']),
      )

      const ordersWithVendor = typedOrders
        .map((order) => ({
          ...order,
          vendorName: order.seller_id ? storeNames.get(order.seller_id) ?? 'Vendedor' : 'Vendedor',
        }))
        .sort((a, b) => {
          const byDate = b.created_at.localeCompare(a.created_at)
          if (byDate !== 0) return byDate
          const byVendor = a.vendorName.localeCompare(b.vendorName, undefined, { sensitivity: 'base' })
          if (byVendor !== 0) return byVendor
          return a.id.localeCompare(b.id)
        })

      if (cancelled) return
      setOrders(ordersWithVendor)
      setItemsByOrderId(itemsMap)
      setShipmentsByOrderId(shipmentsMap)
      setLoading(false)
    }

    void load().catch((e) => {
      if (cancelled) return
      setError(e instanceof Error ? e.message : 'Error cargando ventas.')
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [supabase, storeId])

  const filterPills: Array<{ id: SalesFilterId; label: string }> = [
    { id: 'today', label: 'Envíos de hoy' },
    { id: 'upcoming', label: 'Próximos días' },
    { id: 'in_transit', label: 'En tránsito' },
    { id: 'finalized', label: 'Finalizadas' },
  ]

  const filterCounts = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const counts: Record<SalesFilterId, number> = {
      today: 0,
      upcoming: 0,
      in_transit: 0,
      finalized: 0,
    }

    for (const order of orders) {
      const shipments = shipmentsByOrderId.get(order.id) ?? []
      const shipment = shipments[0] ?? null
      const shipmentStatus = shipment?.status ?? 'pending'
      const shipmentDate = shipment ? getShipmentDate(shipment, order.created_at) : order.created_at

      if (isSameDay(shipmentDate, todayKey)) counts.today += 1
      if (!isSameDay(shipmentDate, todayKey) && shipmentStatus !== 'in_transit' && shipmentStatus !== 'delivered') {
        counts.upcoming += 1
      }
      if (shipmentStatus === 'in_transit') counts.in_transit += 1
      if (shipmentStatus === 'delivered') counts.finalized += 1
    }

    return counts
  }, [orders, shipmentsByOrderId])

  const filteredOrders = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)

    return orders.filter((order) => {
      const shipments = shipmentsByOrderId.get(order.id) ?? []
      const shipment = shipments[0] ?? null
      const shipmentStatus = shipment?.status ?? 'pending'
      const shipmentDate = shipment ? getShipmentDate(shipment, order.created_at) : order.created_at

      switch (activeFilter) {
        case 'today':
          return isSameDay(shipmentDate, todayKey)
        case 'upcoming':
          return (
            !isSameDay(shipmentDate, todayKey) &&
            shipmentStatus !== 'in_transit' &&
            shipmentStatus !== 'delivered'
          )
        case 'in_transit':
          return shipmentStatus === 'in_transit'
        case 'finalized':
          return shipmentStatus === 'delivered'
        default:
          return true
      }
    })
  }, [activeFilter, orders, shipmentsByOrderId])

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h2 className='text-2xl font-bold'>Mis ventas</h2>
        <p className='text-sm text-muted-foreground'>Tus pedidos como vendedor.</p>
      </div>

      <div className='rounded-3xl bg-zinc-100/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            {filterPills.map((pill) => {
              const active = activeFilter === pill.id

              return (
                <button
                  key={pill.id}
                  type='button'
                  onClick={() => setActiveFilter(pill.id)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                    'hover:-translate-y-[1px] hover:shadow-sm',
                    active
                      ? 'border border-white bg-white text-neutral-900 shadow-md'
                      : 'text-neutral-600 hover:bg-white/80 hover:text-neutral-900',
                  )}
                >
                  {pill.label}
                  <span
                    className={cn(
                      'ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                      active ? 'bg-neutral-100 text-neutral-700' : 'bg-white/70 text-neutral-500',
                    )}
                  >
                    {filterCounts[pill.id]}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            type='button'
            className='inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] hover:text-slate-900 hover:shadow-md'
          >
            Gestionar Posventa
            <ChevronRight className='h-3.5 w-3.5' />
          </button>
        </div>
      </div>

      {loading ? (
        <div className='space-y-3'>
          <Skeleton className='h-10 w-52' />
          <Skeleton className='h-40 w-full' />
        </div>
      ) : error ? (
        <Card>
          <CardContent className='text-sm text-destructive'>{error}</CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin ventas todavía</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            Cuando alguien compre en tu tienda, aparecerán acá.
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>
              {filterPills.find((pill) => pill.id === activeFilter)?.label ?? 'Ventas'}
            </CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            No tenés ventas para este filtro.
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {filteredOrders.map((o) => {
            const items = itemsByOrderId.get(o.id) ?? []
            const itemsCount = items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
            const shipment = (shipmentsByOrderId.get(o.id) ?? [])[0] ?? null
            const shipmentLabel = shipment
              ? SHIPMENT_STATUS_PRESENTATION[shipment.status]?.label ?? shipment.status
              : 'Pendiente'

            return (
              <Card key={o.id}>
                <CardHeader className='gap-2 pb-3'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='space-y-1'>
                      <CardTitle className='text-base'>Orden {o.id}</CardTitle>
                      <div className='text-xs text-muted-foreground'>
                        {o.status} • {o.payment_status}
                      </div>
                      <div className='text-xs font-medium text-muted-foreground'>{shipmentLabel}</div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-semibold'>{formatMoney(o.total)}</div>
                      <div className='text-xs text-muted-foreground'>Items: {itemsCount}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {items.length === 0 ? (
                    <div className='text-sm text-muted-foreground'>Sin items para esta orden.</div>
                  ) : (
                    <ul className='space-y-2'>
                      {items.map((it, idx) => (
                        <li key={`${o.id}_${idx}`} className='flex items-start justify-between gap-4'>
                          <div className='min-w-0'>
                            <div className='truncate text-sm font-medium'>{it.title_snapshot}</div>
                            <div className='text-xs text-muted-foreground'>
                              Cantidad: {it.quantity} • {formatMoney(it.price_snapshot)} c/u
                            </div>
                          </div>
                          <div className='text-sm font-semibold'>
                            {formatMoney((it.price_snapshot ?? 0) * (it.quantity ?? 0))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className='text-xs text-muted-foreground'>
                    Fecha: {new Date(o.created_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

