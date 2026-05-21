'use client'

import { Minus, Plus, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/stores/cart-store/cart-store'
import { getListingTypeLabel } from '@/lib/listing'

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, itemCount, totalPrice, setQuantity, removeItem } = useCartStore()

  return (
    <Sheet
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent side='right' className='w-full sm:max-w-md p-0'>
        <div className='flex h-full flex-col'>
          <SheetHeader className='p-4'>
            <div className='flex items-center justify-between gap-3'>
              <SheetTitle className='flex items-center gap-2'>
                <ShoppingCart className='size-4' />
                Tu carrito
              </SheetTitle>
              <button
                type='button'
                onClick={onClose}
                className='rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground'
                aria-label='Close cart'
              >
                ✕
              </button>
            </div>
          </SheetHeader>

          <Separator />

          <div className='flex-1'>
            {items.length === 0 ? (
              <div className='flex h-full flex-col items-center justify-center gap-2 p-6 text-center'>
                <p className='text-sm text-muted-foreground'>
                  Tu carrito está vacío. Agrega algo que te guste.
                </p>
                <p className='text-xs text-muted-foreground'>Próximamente: quick add, opciones, reservas.</p>
              </div>
            ) : (
              <div className='h-full overflow-y-auto'>
                <div className='space-y-3 p-4'>
                  {items.map((item) => (
                    <div key={item.id} className='rounded-2xl border bg-background p-3'>
                      <div className='flex gap-3'>
                        <img
                          src={item.image}
                          alt={item.title}
                          className='h-14 w-14 rounded-xl object-cover'
                        />

                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center justify-between gap-2'>
                            <div className='min-w-0'>
                              <div className='truncate text-sm font-semibold'>{item.title}</div>
                              <div className='text-xs text-muted-foreground'>
                                {getListingTypeLabel(item.listingType)}
                              </div>
                            </div>
                            <div className='text-sm font-semibold'>{formatMoney(item.unitPrice)}</div>
                          </div>

                          <div className='mt-3 flex items-center justify-between gap-3'>
                            <div className='flex items-center gap-2 rounded-full border bg-white/0 px-2 py-1'>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 rounded-full'
                                onClick={() =>
                                  setQuantity(
                                    item.listingType,
                                    item.variantId,
                                    Math.max(0, item.quantity - 1)
                                  )
                                }
                                aria-label='Decrease quantity'
                              >
                                <Minus className='size-4' />
                              </Button>

                              <span className='w-6 text-center text-sm font-medium'>{item.quantity}</span>

                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 rounded-full'
                                onClick={() =>
                                  setQuantity(item.listingType, item.variantId, item.quantity + 1)
                                }
                                aria-label='Increase quantity'
                              >
                                <Plus className='size-4' />
                              </Button>
                            </div>

                            <div className='text-sm font-semibold'>
                              {formatMoney(item.unitPrice * item.quantity)}
                            </div>
                          </div>

                          <div className='mt-2 flex justify-end'>
                            <button
                              type='button'
                              className='text-xs text-muted-foreground hover:text-foreground'
                                onClick={() => removeItem(item.listingType, item.variantId)}
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='p-4'>
            <Separator className='mb-3' />
            <div className='mb-4 flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>{itemCount} artículos</span>
              <span className='text-sm font-semibold'>Total: {formatMoney(totalPrice)}</span>
            </div>

            <Button asChild className='w-full'>
              <Link href='/checkout'>Ir al checkout</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}