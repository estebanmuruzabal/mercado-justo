'use client'

import { ShoppingCart } from 'lucide-react'
import { cn } from '@/shared/utils/utils'

export function CartButton({
  itemCount,
  showBadge,
  onClick,
  className,
}: {
  itemCount: number
  showBadge: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label='Abrir carrito'
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 transition-colors hover:bg-neutral-200',
        className,
      )}
    >
      <ShoppingCart className='h-4 w-4' aria-hidden='true' />
      {showBadge && itemCount > 0 ? (
        <span className='absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF385C] px-1 text-[10px] font-bold leading-none text-white'>
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      ) : null}
    </button>
  )
}
