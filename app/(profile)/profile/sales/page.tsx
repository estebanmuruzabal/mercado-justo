import Link from 'next/link'

import { PROFILE_PATH } from '@/lib/routes'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default async function SalesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className='min-h-screen bg-background px-6 py-10'>
        <p className='text-sm text-muted-foreground'>Iniciá sesión para ver tus ventas.</p>
      </main>
    )
  }

  // “Mis ventas” solo para usuarios con store habilitada.
  const { data: storeRow, error: storeError } = await supabase
    .from('store')
    .select('id,name')
    .eq('id', user.id)
    .maybeSingle()

  if (storeError) throw storeError

  type StoreRow = {
    id: string
    name: string | null
  }

  const typedStore = storeRow as StoreRow | null

  if (!typedStore) {
    return (
      <div className='space-y-6'>
        <div className='space-y-1'>
          <h2 className='text-2xl font-bold'>Mis ventas</h2>
          <p className='text-sm text-muted-foreground'>
            Para ver ventas, primero habilitá tu tienda en “Modo vendedor”.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activá tu tienda</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            <Link href={PROFILE_PATH}>Ir a tu perfil</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const storeId = String(typedStore.id)

  type OrderRowDb = {
    id: string
    status: string | null
    payment_status: string | null
    subtotal: number | null
    total: number | null
    created_at: string | null
    buyer_id: string | null
  }

  const { data: ordersRows, error: ordersError } = await supabase
    .from('order')
    .select('id,status,payment_status,subtotal,total,created_at,buyer_id')
    .eq('seller_id', storeId)
    .order('created_at', { ascending: false })

  if (ordersError) throw ordersError

  const typedOrderRows = (ordersRows ?? []) as unknown as OrderRowDb[]

  const orders = typedOrderRows.map((r) => ({
    id: String(r.id),
    status: String(r.status ?? 'pending'),
    paymentStatus: String(r.payment_status ?? 'unpaid'),
    subtotal: Number(r.subtotal ?? 0),
    total: Number(r.total ?? 0),
    createdAt: String(r.created_at ?? ''),
    buyerId: String(r.buyer_id ?? ''),
  }))

  const orderIds = orders.map((o) => o.id)

  type OrderItemRow = {
    order_id: string
    quantity: number
    title_snapshot: string
    price_snapshot: number
  }

  type OrderItemRowDb = {
    order_id: string
    quantity: number | null
    title_snapshot: string | null
    price_snapshot: number | null
  }

  const { data: itemsRows } = orderIds.length
    ? await supabase
        .from('order_item')
        .select('order_id,quantity,title_snapshot,price_snapshot')
        .in('order_id', orderIds)
    : { data: [] as OrderItemRowDb[] }

  const itemsByOrderId = new Map<string, OrderItemRow[]>()
  const typedItems = (itemsRows ?? []) as unknown as OrderItemRowDb[]

  for (const it of typedItems) {
    const key = String(it.order_id)
    const prev = itemsByOrderId.get(key) ?? []
    prev.push({
      order_id: key,
      quantity: Number(it.quantity ?? 0),
      title_snapshot: String(it.title_snapshot ?? ''),
      price_snapshot: Number(it.price_snapshot ?? 0),
    })
    itemsByOrderId.set(key, prev)
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h2 className='text-2xl font-bold'>Mis ventas</h2>
        <p className='text-sm text-muted-foreground'>
          {typedStore.name ? `Tienda: ${typedStore.name}` : 'Tus pedidos como vendedor.'}
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin ventas todavía</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            Cuando alguien compre en tu tienda, aparecerán acá.
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {orders.map((o) => {
            const items = itemsByOrderId.get(o.id) ?? []
            const itemsCount = items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)

            return (
              <Card key={o.id}>
                <CardHeader className='gap-2 pb-3'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='space-y-1'>
                      <CardTitle className='text-base'>Orden {o.id}</CardTitle>
                      <div className='text-xs text-muted-foreground'>
                        {o.status} • {o.paymentStatus}
                      </div>
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

                  <div className='text-xs text-muted-foreground'>Fecha: {new Date(o.createdAt).toLocaleString()}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

