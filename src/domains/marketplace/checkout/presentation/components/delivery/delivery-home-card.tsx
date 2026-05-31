'use client'

import { Truck } from 'lucide-react'

import { useLocationContext } from '@/shared/maps/location/presentation/location-context'
import { Button } from '@/shared/ui/button'
import { formatDistanceFromUser } from '@/domains/marketplace/checkout/domain/checkout/distance-label'
import { useLocationStore } from '@/shared/maps/location/presentation/stores/location.store'
import { useUserLocationStore } from '@/shared/maps/location/presentation/stores/useUserLocationStore'

export function DeliveryHomeCard() {
  const { openReceiveModeChoice } = useLocationContext()
  const address = useLocationStore((s) => s.address)
  const city = useLocationStore((s) => s.city)
  const province = useLocationStore((s) => s.province)
  const latitude = useLocationStore((s) => s.latitude)
  const longitude = useLocationStore((s) => s.longitude)
  const userLat = useUserLocationStore((s) => s.latitude)
  const userLng = useUserLocationStore((s) => s.longitude)

  const distanceLabel = formatDistanceFromUser(userLat, userLng, latitude, longitude)
  const locationLine =
    city && province ? `${address} - ${city}, ${province}` : address ?? 'Sin dirección'

  return (
    <div className='rounded-2xl border-2 border-neutral-200 bg-white p-4 shadow-sm'>
      <div className='flex items-start gap-3'>
        <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF385C]/10'>
          <Truck className='h-5 w-5 text-[#FF385C]' />
        </span>
        <div className='min-w-0 flex-1 space-y-1'>
          <p className='text-sm font-semibold text-neutral-900'>Enviar a domicilio</p>
          <p className='text-sm text-neutral-700'>{locationLine}</p>
          {distanceLabel ? (
            <p className='text-xs text-neutral-500'>A {distanceLabel} de tu ubicación</p>
          ) : null}
          <p className='text-xs font-medium text-emerald-700'>Envío: a confirmar</p>
        </div>
      </div>
      <Button
        type='button'
        variant='outline'
        className='mt-4 w-full rounded-full'
        onClick={openReceiveModeChoice}
      >
        Modificar domicilio o elegir otro
      </Button>
    </div>
  )
}
