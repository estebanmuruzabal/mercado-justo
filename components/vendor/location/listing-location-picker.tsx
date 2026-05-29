'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { ResistenciaMapPicker } from '@/components/vendor-dashboard/vendor-seller/ResistenciaMapPicker'
import { VENDOR_SELLER_PATH } from '@/lib/routes'
import { useListingLocation } from './use-listing-location'

export type ListingLatLng = { latitude: number | null; longitude: number | null }

export function ListingLocationPicker({
  value,
  onChange,
  sellerLocation,
  disabled,
}: {
  value: ListingLatLng
  onChange: (next: ListingLatLng) => void
  sellerLocation: ListingLatLng | null
  disabled?: boolean
}) {
  const { canCopy, copyFromSeller } = useListingLocation({ sellerLocation, onChange })

  const hasCoords = value.latitude != null && value.longitude != null
  const sellerHasCoords = Boolean(sellerLocation && sellerLocation.latitude != null && sellerLocation.longitude != null)

  type Mode = 'seller' | 'map' | 'browser'

  const initialMode: Mode = useMemo(() => {
    if (sellerHasCoords && hasCoords) {
      // If listing matches seller coords, assume it came from there.
      const sameLat = Math.abs((value.latitude ?? 0) - (sellerLocation?.latitude ?? 0)) < 0.00001
      const sameLng = Math.abs((value.longitude ?? 0) - (sellerLocation?.longitude ?? 0)) < 0.00001
      if (sameLat && sameLng) return 'seller'
    }
    // If we already have coordinates, default to the editable map mode.
    if (hasCoords) return 'map'
    // Otherwise default to seller (if available) or map.
    return sellerHasCoords ? 'seller' : 'map'
  }, [hasCoords, sellerHasCoords, sellerLocation?.latitude, sellerLocation?.longitude, value.latitude, value.longitude])

  const [mode, setMode] = useState<Mode>(initialMode)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  useEffect(() => {
    if (disabled) return
    if (mode === 'seller') {
      if (!canCopy) return
      // Avoid re-copying on every render; only copy if values differ.
      const lat = sellerLocation?.latitude ?? null
      const lng = sellerLocation?.longitude ?? null
      if (lat == null || lng == null) return
      if (value.latitude === lat && value.longitude === lng) return
      copyFromSeller()
      setGeoError(null)
      setGeoLoading(false)
    }
  }, [mode, canCopy, copyFromSeller, disabled, sellerLocation, value.latitude, value.longitude])

  useEffect(() => {
    if (disabled) return
    if (mode !== 'browser') return
    if (hasCoords) return // already have coords; don't prompt again.

    setGeoError(null)
    if (!('geolocation' in navigator)) {
      setGeoError('Tu navegador no soporta geolocalización.')
      return
    }

    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setGeoLoading(false)
        setGeoError(null)
      },
      (err) => {
        setGeoLoading(false)
        setGeoError(err.message || 'No se pudo obtener tu ubicación.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [mode, disabled, hasCoords, onChange])

  const showMap = mode === 'map'
  const inputsReadOnly = mode !== 'map'

  return (
    <div className='space-y-3'>
      <div className='space-y-1'>
        <Label>Ubicación del producto</Label>

        {!sellerHasCoords ? (
          <p className='text-sm text-muted-foreground'>
            Configura primero la ubicación de tu negocio. Si no, podés configurar manualmente o ir al perfil del
            vendedor.
          </p>
        ) : null}

        {!sellerHasCoords ? (
          <div className='text-sm'>
            <Link href={VENDOR_SELLER_PATH} className='text-primary hover:underline'>
              Configurá la ubicación de tu negocio
            </Link>
          </div>
        ) : null}
      </div>

      <div className='grid gap-2 sm:grid-cols-3'>
        <Button
          type='button'
          variant={mode === 'seller' ? 'default' : 'secondary'}
          disabled={disabled || !canCopy}
          onClick={() => setMode('seller')}
        >
          Usar ubicación del negocio
        </Button>
        <Button
          type='button'
          variant={mode === 'map' ? 'default' : 'secondary'}
          disabled={disabled}
          onClick={() => setMode('map')}
        >
          Seleccionar ubicación
        </Button>
        <Button
          type='button'
          variant={mode === 'browser' ? 'default' : 'secondary'}
          disabled={disabled}
          onClick={() => setMode('browser')}
        >
          Usar mi ubicación actual
        </Button>
      </div>

      {mode === 'browser' && geoLoading ? (
        <p className='text-sm text-muted-foreground'>Solicitando ubicación…</p>
      ) : null}

      {mode === 'browser' && geoError ? (
        <p className='text-sm text-destructive'>{geoError}</p>
      ) : null}

      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        <div className='space-y-1'>
          <Label htmlFor='product-latitude'>Latitud</Label>
          <Input
            id='product-latitude'
            inputMode='decimal'
            placeholder='-27.4705'
            value={value.latitude ?? ''}
            disabled={disabled}
            readOnly={inputsReadOnly}
            onChange={(e) => {
              const n = e.target.value === '' ? null : Number(e.target.value)
              onChange({ latitude: n != null && Number.isFinite(n) ? n : null, longitude: value.longitude })
            }}
          />
        </div>

        <div className='space-y-1'>
          <Label htmlFor='product-longitude'>Longitud</Label>
          <Input
            id='product-longitude'
            inputMode='decimal'
            placeholder='-58.9868'
            value={value.longitude ?? ''}
            disabled={disabled}
            readOnly={inputsReadOnly}
            onChange={(e) => {
              const n = e.target.value === '' ? null : Number(e.target.value)
              onChange({ longitude: n != null && Number.isFinite(n) ? n : null, latitude: value.latitude })
            }}
          />
        </div>
      </div>

      {showMap ? (
        <ResistenciaMapPicker
          value={
            hasCoords && value.latitude != null && value.longitude != null
              ? { latitude: value.latitude, longitude: value.longitude }
              : null
          }
          onChange={(p) => onChange({ latitude: p.latitude, longitude: p.longitude })}
        />
      ) : null}
    </div>
  )
}

