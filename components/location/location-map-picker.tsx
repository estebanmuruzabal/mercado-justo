'use client'

import { useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useMapEvents } from 'react-leaflet'
import type { LatLng } from '@/lib/location/location-types'
import { configureLeafletIcons, getDefaultMapCenter } from '@/lib/location/leaflet-config'

import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { LatLngExpression } from 'leaflet'

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
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (latLng: LatLng) => void
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    },
  })
  return null
}

export function LocationMapPicker({
  value,
  onChange,
  heightClassName = 'h-[280px] md:h-[360px]',
  enableClickToPlace = true,
}: {
  value: LatLng | null
  onChange: (next: LatLng) => void
  heightClassName?: string
  enableClickToPlace?: boolean
}) {
  const center = useMemo<[number, number]>(() => {
    return value ? ([value.latitude, value.longitude] as [number, number]) : getDefaultMapCenter(null)
  }, [value])

  useEffect(() => {
    // Fix marker icon asset URLs.
    void (async () => {
      const L = await import('leaflet')
      L.default?.Icon?.Default?.mergeOptions({
        iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
        iconUrl: markerIcon.src ?? markerIcon,
        shadowUrl: markerShadow.src ?? markerShadow,
      })
    })()

    void configureLeafletIcons()
  }, [])

  return (
    <LeafletMapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      className={heightClassName}
    >
      <LeafletTileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <ClickToPlace enabled={enableClickToPlace} onChange={onChange} />

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
  )
}

