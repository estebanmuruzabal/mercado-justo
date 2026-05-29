'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import type { CartItem } from '@/lib/listing'

import { OrderLineItems } from '../confirmation/order-line-items'

export function CartSection({
  items,
  storeNames,
  multiVendorError,
  setQuantity,
  removeItem,
  onContinue,
}: {
  items: CartItem[]
  storeNames: Record<string, string>
  multiVendorError: string | null
  setQuantity: (listingType: CartItem['listingType'], variantId: string, quantity: number) => void
  removeItem: (listingType: CartItem['listingType'], variantId: string) => void
  onContinue: () => void
}) {
  const canContinue = items.length > 0 && !multiVendorError

  return (
    <div className='space-y-4'>
      {multiVendorError ? (
        <p className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
          {multiVendorError}
        </p>
      ) : null}

      <OrderLineItems
        items={items}
        storeNames={storeNames}
        setQuantity={setQuantity}
        removeItem={removeItem}
      />

      {items.length === 0 ? (
        <p className='text-center text-sm text-neutral-600'>
          <Link href='/' className='font-medium text-[#FF385C] hover:underline'>
            Seguir comprando
          </Link>
        </p>
      ) : (
        <Button
          type='button'
          className='w-full rounded-full'
          disabled={!canContinue}
          onClick={onContinue}
        >
          Continuar
        </Button>
      )}
    </div>
  )
}
