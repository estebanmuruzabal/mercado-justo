'use client'

import { Map, MapPin } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { RESISTENCIA_CENTER } from '@/shared/maps/location/leaflet-config'
import { useUserLocationStore } from '@/shared/maps/location/presentation/stores/useUserLocationStore'

export function LocationPrompt() {
  const { latitude, loading, error, requestLocation, setLocation } = useUserLocationStore()

  if (latitude !== null) return null

  return (
    <div className='mx-4 mb-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-start gap-3'>
        <MapPin className='mt-0.5 h-5 w-5 shrink-0 text-[#FF385C]' />
        <div>
          <p className='text-sm font-semibold text-neutral-900'>Activá tu ubicación</p>
          <p className='text-sm text-neutral-600'>
            Para ver distancias y filtrar por radio, necesitamos saber dónde estás.
          </p>
          {error ? <p className='mt-1 text-xs text-red-600'>{error}</p> : null}
        </div>
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          size='sm'
          disabled={loading}
          onClick={() => requestLocation()}
          className='rounded-full bg-[#FF385C] hover:bg-[#e0314f]'
        >
          {loading ? 'Obteniendo...' : 'Usar mi ubicación'}
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='rounded-full'
          onClick={() =>
            setLocation(RESISTENCIA_CENTER.latitude, RESISTENCIA_CENTER.longitude, 'manual')
          }
        >
          <Map className='mr-1.5 h-4 w-4' />
          Resistencia
        </Button>
      </div>
    </div>
  )
}
