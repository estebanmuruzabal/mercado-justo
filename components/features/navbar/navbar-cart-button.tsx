'use client'

import { ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store/cart-store'

export function NavbarCartButton({ onOpen }: { onOpen: () => void }) {
  const { itemCount } = useCartStore()

  return (
    <Button
      type='button'
      variant='ghost'
      className='relative h-10 w-10 rounded-full'
      onClick={onOpen}
      aria-label='Open cart'
    >
      <ShoppingCart className='size-5' />
      {itemCount > 0 ? (
        <span className='absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-medium text-white'>
          {itemCount}
        </span>
      ) : null}
    </Button>
  )
}

