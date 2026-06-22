'use client'

import { useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { LatLngExpression } from 'leaflet'

import { Loader2 } from 'lucide-react'

import type { PublicLocationPreview } from '@/domains/users/domain/user-location'

import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import { MapViewSync } from './MapViewSync'

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
const LeafletCircle = dynamic(
  () => import('react-leaflet').then((m) => m.Circle),
  { ssr: false },
)

export function LocationPreviewMap({
  preview,
  isResolvingCity = false,
  heightClassName = 'h-[200px] sm:h-[260px]',
}: {
  preview: PublicLocationPreview | null
  isResolvingCity?: boolean
  heightClassName?: string
}) {
  useEffect(() => {
    void (async () => {
      const L = await import('leaflet')
      L.default?.Icon?.Default?.mergeOptions({
        iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
        iconUrl: markerIcon.src ?? markerIcon,
        shadowUrl: markerShadow.src ?? markerShadow,
      })
    })()
  }, [])

  const mapConfig = useMemo(() => {
    if (!preview || preview.mode === 'city') return null

    const center: LatLngExpression = [preview.latitude, preview.longitude]
    const zoom = preview.mode === 'circle' && preview.radiusMeters >= 500 ? 13 : 15

    return { center, zoom, preview }
  }, [preview])

  if (!preview) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground ${heightClassName}`}
      >
        Elegí una ubicación para ver la vista previa.
      </div>
    )
  }

  if (preview.mode === 'city') {
    if (isResolvingCity) {
      return (
        <div
          className={`flex items-center justify-center gap-2 rounded-lg border bg-muted/20 px-4 text-center ${heightClassName}`}
        >
          <Loader2 className='size-4 animate-spin text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>Detectando ciudad…</p>
        </div>
      )
    }

    return (
      <div
        className={`flex items-center justify-center rounded-lg border bg-muted/20 px-4 text-center ${heightClassName}`}
      >
        <p className='text-lg font-semibold text-foreground'>{preview.label}</p>
      </div>
    )
  }

  if (!mapConfig) return null

  return (
    <div className={`overflow-hidden rounded-lg border ${heightClassName}`}>
      <LeafletMapContainer center={mapConfig.center} zoom={mapConfig.zoom} scrollWheelZoom={false} className='h-full w-full'>
        <LeafletTileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <MapViewSync center={mapConfig.center as [number, number]} zoom={mapConfig.zoom} />
        {mapConfig.preview.mode === 'circle' ? (
          <LeafletCircle
            center={[mapConfig.preview.latitude, mapConfig.preview.longitude]}
            radius={mapConfig.preview.radiusMeters}
            pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2 }}
          />
        ) : (
          <LeafletMarker position={[mapConfig.preview.latitude, mapConfig.preview.longitude]} />
        )}
      </LeafletMapContainer>
    </div>
  )
}
