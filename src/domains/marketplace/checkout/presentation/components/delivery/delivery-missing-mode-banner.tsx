'use client'

import { MapPin } from 'lucide-react'

import { useLocationContext } from '@/shared/maps/location/presentation/location-context'
import { Button } from '@/shared/ui/button'

export function DeliveryMissingModeBanner() {
  const { openReceiveModeChoice } = useLocationContext()

  return (
    <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4'>
      <div className='flex gap-3'>
        <MapPin className='mt-0.5 h-5 w-5 shrink-0 text-amber-700' />
        <div className='space-y-3'>
          <div>
            <p className='text-sm font-semibold text-neutral-900'>Elegí cómo querés recibir</p>
            <p className='mt-1 text-sm text-neutral-600'>
              Antes de buscar o confirmar, indicá si preferís envío a domicilio o retiro.
            </p>
          </div>
          <Button
            type='button'
            variant='secondary'
            className='rounded-full'
            onClick={openReceiveModeChoice}
          >
            Elegir envío o retiro
          </Button>
        </div>
      </div>
    </div>
  )
}
