'use client'

import { MapPin, Store } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/utils'
import { formatDistanceFromUser } from '@/domains/marketplace/checkout/domain/checkout/distance-label'
import type { PickupHub } from '@/domains/marketplace/checkout/domain/checkout/types'
import { useUserLocationStore } from '@/shared/maps/location/presentation/stores/useUserLocationStore'

export function PickupHubCard({
  hub,
  selected,
  onSelect,
  onViewMap,
}: {
  hub: PickupHub
  selected: boolean
  onSelect: () => void
  onViewMap?: () => void
}) {
  const userLat = useUserLocationStore((s) => s.latitude)
  const userLng = useUserLocationStore((s) => s.longitude)
  const distanceLabel = formatDistanceFromUser(
    userLat,
    userLng,
    hub.latitude,
    hub.longitude,
  )

  return (
    <label
      className={cn(
        'block cursor-pointer rounded-2xl border-2 bg-white p-4 transition-colors',
        selected ? 'border-[#FF385C] ring-2 ring-[#FF385C]/15' : 'border-neutral-200 hover:border-neutral-300',
      )}
    >
      <div className='flex items-start gap-3'>
        <input
          type='radio'
          name='pickup-hub'
          checked={selected}
          onChange={onSelect}
          className='mt-1 h-4 w-4 accent-[#FF385C]'
        />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <Store className='h-4 w-4 text-[#FF385C]' />
            <span className='text-sm font-semibold text-neutral-900'>{hub.name}</span>
          </div>
          {distanceLabel ? (
            <p className='mt-1 text-xs text-neutral-500'>A {distanceLabel}</p>
          ) : null}
          <p className='mt-1 text-xs text-neutral-600'>{hub.scheduleLabel}</p>
          <p className='mt-1 flex items-start gap-1 text-sm text-neutral-700'>
            <MapPin className='mt-0.5 h-3.5 w-3.5 shrink-0' />
            {hub.address}, {hub.city}
          </p>
          <p className='mt-2 text-xs font-medium text-neutral-900'>Costo: {hub.costLabel}</p>
        </div>
      </div>
      {selected && onViewMap ? (
        <Button
          type='button'
          variant='link'
          className='mt-3 h-auto p-0 text-sm text-[#FF385C]'
          onClick={(e) => {
            e.preventDefault()
            onViewMap()
          }}
        >
          Ver punto en el mapa o elegir otro
        </Button>
      ) : null}
    </label>
  )
}
