'use client'

import { useEffect, useMemo, useState } from 'react'

import { createClient } from '@/shared/database/supabase/client'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

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

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatPurchaseDayLabel(isoDateTime: string) {
  const date = new Date(isoDateTime)
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida'

  const label = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
  }).format(date)

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function PurchasesTab() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [itemsByOrderId, setItemsByOrderId] = useState<Map<string, OrderItemRow[]>>(new Map())

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: authData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      const userId = authData.user?.id
      if (!userId) {
        setOrders([])
        setItemsByOrderId(new Map())
        setLoading(false)
        return
      }

      const { data: ordersRows, error: ordersError } = await supabase
        .from('order')
        .select('id,status,payment_status,subtotal,total,created_at,seller_id')
        .eq('buyer_id', userId)
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

      if (orderIds.length) {
        const { data: itemsRows, error: itemsError } = await supabase
          .from('order_item')
          .select('order_id,quantity,title_snapshot,price_snapshot')
          .in('order_id', orderIds)

        if (itemsError) throw itemsError
        items = (itemsRows ?? []).map((it: unknown) => {
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
      }

      const map = new Map<string, OrderItemRow[]>()
      for (const it of items) {
        const key = String(it.order_id)
        const prev = map.get(key) ?? []
        prev.push(it)
        map.set(key, prev)
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
      setItemsByOrderId(map)
      setLoading(false)
    }

    void load().catch((e) => {
      if (cancelled) return
      setError(e instanceof Error ? e.message : 'Error cargando compras.')
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [supabase])

  const ordersByDay = useMemo(() => {
    const grouped = new Map<string, OrderRow[]>()

    for (const order of orders) {
      const dayKey = order.created_at.slice(0, 10)
      const current = grouped.get(dayKey) ?? []
      current.push(order)
      grouped.set(dayKey, current)
    }

    return [...grouped.entries()].map(([dayKey, dayOrders]) => ({
      dayKey,
      label: dayOrders[0] ? formatPurchaseDayLabel(dayOrders[0].created_at) : 'Fecha desconocida',
      orders: dayOrders.sort((a, b) => {
        const byDate = b.created_at.localeCompare(a.created_at)
        if (byDate !== 0) return byDate
        const byVendor = a.vendorName.localeCompare(b.vendorName, undefined, { sensitivity: 'base' })
        if (byVendor !== 0) return byVendor
        return a.id.localeCompare(b.id)
      }),
    }))
  }, [orders])

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h2 className='text-2xl font-bold'>Mis compras</h2>
        <p className='text-sm text-muted-foreground'>Historial de tus pedidos.</p>
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
            <CardTitle>Sin compras todavía</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            Cuando compres algo, vas a poder ver el estado de tus pedidos acá.
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {ordersByDay.map(({ dayKey, label, orders: dayOrders }) => (
            <section key={dayKey} className='space-y-3'>
              <div className='space-y-1'>
                <h3 className='text-lg font-semibold'>{label}</h3>
                <p className='text-sm text-muted-foreground'>
                  {dayOrders.length} orden{dayOrders.length === 1 ? '' : 'es'} en este día.
                </p>
              </div>

              <div className='space-y-3'>
                {dayOrders.map((o) => {
                  const items = itemsByOrderId.get(o.id) ?? []
                  const itemsCount = items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
                  return (
                    <Card key={o.id}>
                      <CardHeader className='gap-2 pb-3'>
                        <div className='flex items-start justify-between gap-4'>
                          <div className='space-y-1'>
                            <CardTitle className='text-base'>Orden {o.id}</CardTitle>
                            <div className='text-xs font-medium text-muted-foreground'>
                              {o.vendorName}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {o.status} • {o.payment_status}
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='text-sm font-semibold'>{formatMoney(o.total)}</div>
                            <div className='text-xs text-muted-foreground'>Items: {itemsCount}</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-2'>
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
                        <div className='text-xs text-muted-foreground'>
                          Fecha: {new Date(o.created_at).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

