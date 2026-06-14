'use client'

import { Store, Truck } from 'lucide-react'

import { Button } from '@/shared/ui/button'

export function LocationModeSwitch({
  onSelectDelivery,
  onSelectPickup,
}: {
  onSelectDelivery: () => void
  onSelectPickup: () => void
}) {
  return (
    <div className='space-y-4'>
      <div className='text-sm font-semibold text-neutral-700'>Elegí cómo querés recibir</div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <Button
          type='button'
          variant='secondary'
          onClick={onSelectDelivery}
          className='rounded-3xl bg-white shadow-sm hover:bg-neutral-50'
        >
          <Truck className='mr-2 h-4 w-4 text-[#FF385C]' />
          Envío
        </Button>

        <Button
          type='button'
          variant='secondary'
          onClick={onSelectPickup}
          className='rounded-3xl bg-white shadow-sm hover:bg-neutral-50'
        >
          <Store className='mr-2 h-4 w-4 text-[#FF385C]' />
          Retiro
        </Button>
      </div>
    </div>
  )
}

