import { createClient } from '@/shared/database/supabase/server'
import { redirect } from 'next/navigation'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { getCheckoutSignInUrl } from '@/domains/auth/domain/auth/checkout'
import { PROFILE_PATH, PURCHASE_SUCCESS_PATH } from '@/shared/routing/routes'

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function parseOrderIds(searchParams: { orderId?: string; orderIds?: string }) {
  const ids = [
    ...(searchParams.orderIds?.split(',') ?? []),
    ...(searchParams.orderId ? [searchParams.orderId] : []),
  ]

  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
}

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; orderIds?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const requestedOrderIds = parseOrderIds(resolvedSearchParams)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const returnPath = requestedOrderIds.length > 0
      ? `${PURCHASE_SUCCESS_PATH}?${new URLSearchParams({
          orderId: requestedOrderIds[0] ?? '',
          orderIds: requestedOrderIds.join(','),
        }).toString()}`
      : PURCHASE_SUCCESS_PATH
    redirect(getCheckoutSignInUrl(returnPath))
  }

  if (requestedOrderIds.length === 0) {
    return (
      <main className='min-h-screen bg-background px-6 py-10'>
        <div className='mx-auto max-w-3xl space-y-3'>
          <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
            ← Volver al inicio
          </Link>
          <h1 className='text-2xl font-bold'>Compra exitosa</h1>
          <p className='text-sm text-muted-foreground'>No se recibió el identificador de la orden.</p>
        </div>
      </main>
    )
  }

  const { data: orderRows, error: orderError } = await supabase
    .from('order')
    .select('id,status,payment_status,total,created_at,seller_id,buyer_id')
    .in('id', requestedOrderIds)
    .eq('buyer_id', user.id)

  if (orderError) throw orderError
  const typedOrders = ((orderRows ?? []) as Array<{
    id: string
    status: string | null
    payment_status: string | null
    total: number | null
    created_at: string | null
    seller_id: string | null
    buyer_id: string | null
  }>)
  const orderById = new Map(typedOrders.map((order) => [order.id, order]))
  const orderedOrders = requestedOrderIds
    .map((id) => orderById.get(id))
    .filter((order): order is (typeof typedOrders)[number] => Boolean(order))

  if (orderedOrders.length === 0) {
    return (
      <main className='min-h-screen bg-background px-6 py-10'>
        <div className='mx-auto max-w-3xl space-y-3'>
          <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
            ← Volver al inicio
          </Link>
          <h1 className='text-2xl font-bold'>No encontramos tu orden</h1>
          <p className='text-sm text-muted-foreground'>
            Puede que no esté disponible o no pertenezca a tu cuenta.
          </p>
        </div>
      </main>
    )
  }

  type OrderItemRowDb = {
    order_id: string
    quantity: number | null
    title_snapshot: string | null
    price_snapshot: number | null
  }

  const { data: itemsRows, error: itemsError } = await supabase
    .from('order_item')
    .select('order_id,quantity,title_snapshot,price_snapshot')
    .in('order_id', requestedOrderIds)

  if (itemsError) throw itemsError

  const typedItems = (itemsRows ?? []) as unknown as OrderItemRowDb[]
  const itemsByOrderId = new Map<string, OrderItemRowDb[]>()
  for (const item of typedItems) {
    const current = itemsByOrderId.get(item.order_id) ?? []
    current.push(item)
    itemsByOrderId.set(item.order_id, current)
  }

  const sellerIds = [...new Set(orderedOrders.map((order) => order.seller_id).filter(Boolean))] as string[]
  const { data: storeRows } = sellerIds.length
    ? await supabase.from('store').select('id,name').in('id', sellerIds)
    : { data: [] as Array<{ id: string; name: string | null }> }

  const storeNames = new Map<string, string>(
    (storeRows ?? []).map((row) => [row.id, row.name?.trim() || 'Vendedor']),
  )

  const orderedSummaries = orderedOrders.map((order) => ({
    order,
    vendorName: order.seller_id ? storeNames.get(order.seller_id) ?? 'Vendedor' : 'Vendedor',
    items: (itemsByOrderId.get(order.id) ?? []).map((r) => ({
      quantity: Number(r.quantity ?? 0),
      title: String(r.title_snapshot ?? ''),
      unitPrice: Number(r.price_snapshot ?? 0),
    })),
  }))

  const grandTotal = orderedSummaries.reduce((sum, summary) => sum + Number(summary.order.total ?? 0), 0)
  const isMultiVendor = orderedSummaries.length > 1
  const missingCount = requestedOrderIds.length - orderedOrders.length

  return (
    <main className='min-h-screen bg-background px-6 py-10'>
      <div className='mx-auto max-w-3xl space-y-6'>
        <div className='space-y-2'>
          <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
            ← Seguir comprando
          </Link>
          <h1 className='text-2xl font-bold'>Compra exitosa</h1>
          <p className='text-sm text-muted-foreground'>
            {isMultiVendor
              ? `${orderedSummaries.length} subórdenes por vendor`
              : `Orden #${orderedSummaries[0]?.order.id ?? requestedOrderIds[0]}`}
            {' '}• Total {formatMoney(grandTotal)}
          </p>
          {missingCount > 0 ? (
            <p className='text-sm text-amber-600'>
              No pudimos cargar {missingCount} suborden{missingCount === 1 ? '' : 'es'}.
            </p>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isMultiVendor ? 'Detalle de tu compra por vendor' : 'Detalle de tu compra'}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-4'>
              {orderedSummaries.map(({ order, vendorName, items }) => (
                <section key={order.id} className='rounded-2xl border border-neutral-200 p-4'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='min-w-0 space-y-1'>
                      <div className='truncate text-sm font-semibold'>{vendorName}</div>
                      <div className='text-xs text-muted-foreground'>
                        Orden #{order.id} • {String(order.status ?? 'pending')} •{' '}
                        {String(order.payment_status ?? 'unpaid')}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-semibold'>
                        {formatMoney(Number(order.total ?? 0))}
                      </div>
                    </div>
                  </div>

                  <ul className='mt-4 space-y-3'>
                    {items.map((item, idx) => (
                      <li key={`${order.id}:${idx}`} className='flex items-start justify-between gap-4'>
                        <div className='min-w-0'>
                          <div className='truncate text-sm font-medium'>{item.title}</div>
                          <div className='text-xs text-muted-foreground'>
                            Cantidad: {item.quantity} • {formatMoney(item.unitPrice)} c/u
                          </div>
                        </div>
                        <div className='text-sm font-semibold'>
                          {formatMoney(item.unitPrice * item.quantity)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <Link
              href={PROFILE_PATH}
              className='inline-block text-sm font-medium text-[#FF385C] hover:underline'
            >
              Ver mis compras en el perfil
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
