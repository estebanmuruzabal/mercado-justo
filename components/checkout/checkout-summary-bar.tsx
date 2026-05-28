'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CheckoutSummaryBar({
  subtotal,
  deliveryPrice,
  total,
  itemCount,
  canConfirm,
  isPending,
  formError,
  onConfirm,
  variant = 'sticky',
}: {
  subtotal: number
  deliveryPrice: number
  total: number
  itemCount: number
  canConfirm: boolean
  isPending: boolean
  formError: string | null
  onConfirm: () => void
  variant?: 'sticky' | 'sidebar'
}) {
  return (
    <div
      className={cn(
        'p-4',
        variant === 'sidebar' && 'rounded-2xl border border-neutral-200 bg-white shadow-sm',
      )}
    >
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-neutral-600'>Subtotal</span>
          <span className='font-semibold text-neutral-900'>${subtotal}</span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-neutral-600'>Envío</span>
          <span className='font-semibold text-neutral-900'>
            {deliveryPrice === 0 ? 'Gratis' : `$${deliveryPrice}`}
          </span>
        </div>
        <div className='flex items-center justify-between border-t border-neutral-100 pt-2'>
          <span className='font-semibold text-neutral-900'>Total</span>
          <span className='text-lg font-bold text-neutral-900'>${total}</span>
        </div>
      </div>

      {formError ? <p className='mt-3 text-sm text-destructive'>{formError}</p> : null}

      <Button
        type='button'
        className='mt-4 h-12 w-full rounded-full text-base font-semibold'
        disabled={!canConfirm || isPending || itemCount === 0}
        onClick={onConfirm}
      >
        {isPending ? 'Procesando...' : 'Confirmar compra'}
      </Button>

      {itemCount === 0 ? (
        <p className='mt-2 text-center text-sm text-neutral-600'>
          <Link href='/' className='font-medium text-[#FF385C] hover:underline'>
            Seguir comprando
          </Link>
        </p>
      ) : null}
    </div>
  )
}
