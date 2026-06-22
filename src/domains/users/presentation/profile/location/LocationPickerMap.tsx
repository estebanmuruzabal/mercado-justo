'use client'

import { useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useMapEvents } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import { MapViewSync } from './MapViewSync'

const WORLD_CENTER: [number, number] = [20, 0]
const WORLD_ZOOM = 2
const PIN_ZOOM = 14

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

function ClickToPlace({
  onChange,
}: {
  onChange: (coords: { latitude: number; longitude: number }) => void
}) {
  useMapEvents({
    click(e) {
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    },
  })
  return null
}

export function LocationPickerMap({
  value,
  onChange,
  heightClassName = 'h-[240px] sm:h-[320px]',
}: {
  value: { latitude: number; longitude: number } | null
  onChange: (coords: { latitude: number; longitude: number }) => void
  heightClassName?: string
}) {
  const center = useMemo<[number, number]>(() => {
    if (value) return [value.latitude, value.longitude]
    return WORLD_CENTER
  }, [value])

  const zoom = value ? PIN_ZOOM : WORLD_ZOOM

  useEffect(() => {
    void (async () => {
      const mod = await import('leaflet')
      const L = ((mod as { default?: unknown }).default ?? mod) as typeof import('leaflet')

      L.Icon?.Default?.mergeOptions({
        iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
        iconUrl: markerIcon.src ?? markerIcon,
        shadowUrl: markerShadow.src ?? markerShadow,
      })
    })()
  }, [])

  return (
    <div className={`overflow-hidden rounded-lg border ${heightClassName}`}>
      <LeafletMapContainer center={center} zoom={zoom} scrollWheelZoom className='h-full w-full'>
        <LeafletTileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <MapViewSync center={center} zoom={zoom} fly={Boolean(value)} />
        <ClickToPlace onChange={onChange} />
        {value ? (
          <LeafletMarker
            position={[value.latitude, value.longitude] as LatLngExpression}
            draggable
            eventHandlers={{
              dragend: (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
                const latlng = e.target.getLatLng()
                onChange({ latitude: latlng.lat, longitude: latlng.lng })
              },
            }}
          />
        ) : null}
      </LeafletMapContainer>
    </div>
  )
}

export { WORLD_CENTER, PIN_ZOOM }
