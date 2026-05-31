'use client'

import { Truck, Store } from 'lucide-react'

export function DeliveryPickupFilter() {
  return (
    <div className='flex gap-2'>
      <button
        type='button'
        disabled
        title='Próximamente'
        className='flex items-center gap-1.5 rounded-full border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-400'
      >
        <Truck className='h-3.5 w-3.5' />
        Envío
      </button>
      <button
        type='button'
        disabled
        title='Próximamente'
        className='flex items-center gap-1.5 rounded-full border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-400'
      >
        <Store className='h-3.5 w-3.5' />
        Retiro
      </button>
    </div>
  )
}
