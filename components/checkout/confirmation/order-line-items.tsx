'use client'

import { Button } from '@/components/ui/button'
import type { CartItem } from '@/lib/listing'

export function OrderLineItems({
  items,
  storeNames,
  setQuantity,
  removeItem,
}: {
  items: CartItem[]
  storeNames: Record<string, string>
  setQuantity: (listingType: CartItem['listingType'], variantId: string, quantity: number) => void
  removeItem: (listingType: CartItem['listingType'], variantId: string) => void
}) {
  if (items.length === 0) {
    return <p className='text-sm text-muted-foreground'>Tu carrito está vacío.</p>
  }

  return (
    <div className='space-y-3'>
      {items.map((item) => (
        <div
          key={item.id}
          className='flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4'
        >
          <div className='min-w-0'>
            <div className='truncate text-sm font-semibold text-neutral-900'>{item.title}</div>
            <div className='text-xs text-neutral-500'>
              Vendedor: {storeNames[item.storeId] ?? item.storeId}
            </div>
            <div className='mt-2 flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='h-9 w-9 rounded-full'
                onClick={() =>
                  setQuantity(item.listingType, item.variantId, Math.max(0, item.quantity - 1))
                }
                aria-label='Disminuir cantidad'
              >
                -
              </Button>
              <div className='w-8 text-center text-sm font-medium'>{item.quantity}</div>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='h-9 w-9 rounded-full'
                onClick={() =>
                  setQuantity(item.listingType, item.variantId, item.quantity + 1)
                }
                aria-label='Aumentar cantidad'
              >
                +
              </Button>
            </div>
          </div>
          <div className='text-right'>
            <div className='text-sm font-semibold'>${item.unitPrice * item.quantity}</div>
            <Button
              type='button'
              variant='ghost'
              className='mt-2 h-auto p-0 text-xs text-neutral-600'
              onClick={() => removeItem(item.listingType, item.variantId)}
            >
              Remover
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
