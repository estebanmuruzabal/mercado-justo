import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCheckoutSignInUrl } from '@/lib/auth/checkout'
import { PROFILE_PATH } from '@/lib/routes'

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const { orderId } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(getCheckoutSignInUrl(`/purchase-success${orderId ? `?orderId=${orderId}` : ''}`))
  }

  if (!orderId) {
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

  const { data: orderRow, error: orderError } = await supabase
    .from('order')
    .select('id,status,payment_status,total,created_at,seller_id,buyer_id')
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .maybeSingle()

  if (orderError) throw orderError
  if (!orderRow) {
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

  type OrderRowTyped = {
    id: string
    status: string | null
    payment_status: string | null
    total: number | null
    created_at: string | null
    seller_id: string | null
    buyer_id: string | null
  }

  const orderTyped = orderRow as OrderRowTyped

  type OrderItemRowDb = {
    quantity: number | null
    title_snapshot: string | null
    price_snapshot: number | null
  }

  const { data: itemsRows, error: itemsError } = await supabase
    .from('order_item')
    .select('quantity,title_snapshot,price_snapshot')
    .eq('order_id', orderId)

  if (itemsError) throw itemsError

  const typedItems = (itemsRows ?? []) as unknown as OrderItemRowDb[]

  const items = typedItems.map((r) => ({
    quantity: Number(r.quantity ?? 0),
    title: String(r.title_snapshot ?? ''),
    unitPrice: Number(r.price_snapshot ?? 0),
  }))

  const total = Number(orderTyped.total ?? 0)

  return (
    <main className='min-h-screen bg-background px-6 py-10'>
      <div className='mx-auto max-w-3xl space-y-6'>
        <div className='space-y-2'>
          <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
            ← Seguir comprando
          </Link>
          <h1 className='text-2xl font-bold'>Compra exitosa</h1>
          <p className='text-sm text-muted-foreground'>
            Orden #{orderId} • {String(orderTyped.status ?? 'pending')} •{' '}
            {String(orderTyped.payment_status ?? 'unpaid')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalle de tu compra</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <ul className='space-y-3'>
              {items.map((it, idx) => (
                <li key={idx} className='flex items-start justify-between gap-4'>
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-medium'>{it.title}</div>
                    <div className='text-xs text-muted-foreground'>
                      Cantidad: {it.quantity} • {formatMoney(it.unitPrice)} c/u
                    </div>
                  </div>
                  <div className='text-sm font-semibold'>{formatMoney(it.unitPrice * it.quantity)}</div>
                </li>
              ))}
            </ul>

            <div className='flex items-center justify-between pt-2'>
              <span className='text-sm text-muted-foreground'>Total</span>
              <span className='text-sm font-semibold'>{formatMoney(total)}</span>
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
