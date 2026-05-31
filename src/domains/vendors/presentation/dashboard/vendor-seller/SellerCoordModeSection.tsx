'use client'

import { Loader2 } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { ResistenciaMapPicker } from './ResistenciaMapPicker'

export function SellerCoordModeSection({
  coordMode,
  onCoordModeChange,
  geocoding,
  latitude,
  longitude,
  onChangeCoords,
  disabled,
}: {
  coordMode: 'auto' | 'map'
  onCoordModeChange: (m: 'auto' | 'map') => void
  geocoding: boolean
  latitude: string
  longitude: string
  onChangeCoords: (p: { latitude: number; longitude: number }) => void
  disabled: boolean
}) {
  const hasCoords = Boolean(latitude.trim()) && Boolean(longitude.trim())

  return (
    <div className='md:col-span-2 space-y-2'>
      <label className='text-sm font-medium text-foreground'>Coordenadas</label>

      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
        <Button
          type='button'
          variant={coordMode === 'auto' ? 'default' : 'secondary'}
          onClick={() => onCoordModeChange('auto')}
          disabled={disabled}
        >
          Auto desde dirección
        </Button>
        <Button
          type='button'
          variant={coordMode === 'map' ? 'default' : 'secondary'}
          onClick={() => onCoordModeChange('map')}
          disabled={disabled}
        >
          Seleccionar en el mapa
        </Button>

        {geocoding ? (
          <span className='inline-flex items-center gap-2 text-xs text-muted-foreground'>
            <Loader2 className='size-3 animate-spin' /> Geocodificando…
          </span>
        ) : null}
      </div>

      {coordMode === 'map' ? (
        <ResistenciaMapPicker
          value={
            hasCoords
              ? { latitude: Number(latitude), longitude: Number(longitude) }
              : null
          }
          onChange={onChangeCoords}
        />
      ) : null}
    </div>
  )
}

