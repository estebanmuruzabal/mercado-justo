'use client'

import { useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useMapEvents } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

import { Button } from '@/components/ui/button'

import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DEFAULT_CENTER: LatLngExpression = [-27.4705, -58.9868]

const BOUNDS: [[number, number], [number, number]] = [
  [-27.70, -59.30],
  [-27.30, -58.60],
]

// Leaflet is client-only. The file itself is 'use client', but we still dynamically import to reduce hydration quirks.
const LeafletMapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false },
)
const LeafletTileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false },
)
const LeafletMarker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false },
)

function ClickToPlaceMarker({
  position,
  onChange,
}: {
  position: LatLngExpression
  onChange: (p: { latitude: number; longitude: number }) => void
}) {
  useMapEvents({
    click(e) {
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    },
  })

  return (
    <LeafletMarker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
          const latlng = e.target.getLatLng()
          onChange({ latitude: latlng.lat, longitude: latlng.lng })
        },
      }}
    />
  )
}

export function ResistenciaMapPicker({
  value,
  onChange,
  heightClassName = 'h-[260px] md:h-[360px]',
}: {
  value: { latitude: number; longitude: number } | null
  onChange: (p: { latitude: number; longitude: number }) => void
  heightClassName?: string
}) {
  const position = useMemo<LatLngExpression>(() => {
    if (!value) return DEFAULT_CENTER
    return [value.latitude, value.longitude]
  }, [value])

  useEffect(() => {
    // Leaflet references `window` during import/initialization in some builds,
    // so we only load it in the browser.
    void (async () => {
      const mod = await import('leaflet')
      const L = ((mod as { default?: unknown }).default ?? mod) as typeof import('leaflet')

      // Leaflet's default icon URLs are relative to the current route in some setups,
      // which can lead to 404s like `/dashboard-vendor/marker-icon.png`.
      L.Icon?.Default?.mergeOptions({
        iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
        iconUrl: markerIcon.src ?? markerIcon,
        shadowUrl: markerShadow.src ?? markerShadow,
      })
    })()
  }, [])

  async function getCurrentLocation() {
    if (!('geolocation' in navigator)) return
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          resolve()
        },
        () => resolve(),
        { enableHighAccuracy: true, timeout: 10000 },
      )
    })
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-sm font-medium'>Seleccioná la ubicación</span>
        <Button type='button' variant='secondary' className='h-8' onClick={() => void getCurrentLocation()}>
          Usar mi ubicación actual
        </Button>
      </div>

      <LeafletMapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%' }}
        className={heightClassName}
        maxBounds={BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <LeafletTileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <ClickToPlaceMarker position={position} onChange={onChange} />
      </LeafletMapContainer>
    </div>
  )
}

