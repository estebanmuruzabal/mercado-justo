'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

import { configureLeafletIcons, getDefaultMapCenter } from '@/lib/location/leaflet-config'
import type { MarketplaceListingWithDistance } from '@/types/marketplace'

import 'leaflet/dist/leaflet.css'

const LeafletMapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false },
)
const LeafletTileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false },
)
const ListingMapMarkers = dynamic(
  () => import('./ListingMapMarker').then((m) => m.ListingMapMarkers),
  { ssr: false },
)
const MapBoundsSync = dynamic(
  () => import('./MapBoundsSync').then((m) => m.MapBoundsSync),
  { ssr: false },
)

export function MarketplaceMap({
  listings,
  selectedId,
  onSelect,
  userCoords,
  className = 'h-full min-h-[320px] w-full rounded-2xl',
  syncBounds = false,
}: {
  listings: MarketplaceListingWithDistance[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  userCoords?: { latitude: number; longitude: number } | null
  className?: string
  syncBounds?: boolean
}) {
  useEffect(() => {
    void configureLeafletIcons()
  }, [])

  const center = getDefaultMapCenter(userCoords ?? null)

  return (
    <div className={className}>
      <LeafletMapContainer
        center={center}
        zoom={13}
        className='h-full w-full rounded-2xl'
        scrollWheelZoom
      >
        <LeafletTileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        {syncBounds ? <MapBoundsSync /> : null}
        <ListingMapMarkers
          listings={listings}
          selectedId={selectedId}
          onSelect={onSelect}
          userCoords={userCoords}
        />
      </LeafletMapContainer>
    </div>
  )
}
