'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'

import { useCartStore } from '@/stores/cart-store/cart-store'
import { createOrderFromCartAction } from '@/server/actions/checkout.actions'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, itemCount, totalPrice, setQuantity, removeItem, clearCart } = useCartStore()

  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [note, setNote] = useState('')

  const cartPayload = useMemo(
    () =>
      items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        storeId: i.storeId,
        title: i.title,
      })),
    [items]
  )

  const subtotal = totalPrice
  const deliveryPrice = 0
  const total = subtotal + deliveryPrice

  return (
    <main className='min-h-screen bg-background px-6 py-10'>
      <div className='mx-auto max-w-2xl space-y-6'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-bold'>Checkout</h1>
          <p className='text-sm text-muted-foreground'>
            {itemCount} artículos en el carrito.
          </p>
        </div>

        <Separator />

        <div className='space-y-3'>
          {items.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Tu carrito está vacío.</p>
          ) : (
            <div className='space-y-3'>
              {items.map((item) => (
                <div key={item.id} className='flex items-start justify-between gap-4 rounded-xl border p-4'>
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-semibold'>{item.title}</div>
                    <div className='text-xs text-muted-foreground'>Vendedor: {item.storeId}</div>
                    <div className='mt-1 flex items-center gap-2'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => setQuantity(item.listingType, item.variantId, Math.max(0, item.quantity - 1))}
                        aria-label='Decrease quantity'
                      >
                        -
                      </Button>
                      <div className='w-8 text-center text-sm font-medium'>{item.quantity}</div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => setQuantity(item.listingType, item.variantId, item.quantity + 1)}
                        aria-label='Increase quantity'
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className='text-right'>
                    <div className='text-sm font-semibold'>${item.unitPrice * item.quantity}</div>
                    <Button type='button' variant='ghost' className='mt-2' onClick={() => removeItem(item.listingType, item.variantId)}>
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className='space-y-3 rounded-xl border p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Subtotal</span>
            <span className='text-sm font-semibold'>${subtotal}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Envío</span>
            <span className='text-sm font-semibold'>${deliveryPrice}</span>
          </div>
          <div className='flex items-center justify-between pt-2'>
            <span className='text-sm text-muted-foreground'>Total</span>
            <span className='text-sm font-semibold'>${total}</span>
          </div>

          <div className='space-y-2 pt-3'>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder='Nota para el vendedor (opcional)' />
            {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}
          </div>

          <Button
            type='button'
            disabled={items.length === 0 || isPending}
            onClick={() => {
              setFormError(null)
              startTransition(async () => {
                try {
                  const { orderId } = await createOrderFromCartAction(cartPayload)
                  clearCart()
                  router.push(`/profile/purchase-success?orderId=${orderId}`)
                } catch (e) {
                  setFormError(e instanceof Error ? e.message : 'No se pudo crear la orden.')
                }
              })
            }}
          >
            Confirmar compra
          </Button>
        </div>
      </div>
    </main>
  )
}

