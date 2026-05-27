'use client'

import dynamic from 'next/dynamic'
import { MapPin, Navigation, Truck } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addDistanceToListings } from '@/lib/location/add-distance-to-listings'
import { configureLeafletIcons, getDefaultMapCenter } from '@/lib/location/leaflet-config'
import { useUserCoordinates } from '@/stores/useUserLocationStore'

import 'leaflet/dist/leaflet.css'

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

export function ListingDetailLocation({
  latitude,
  longitude,
  title,
}: {
  latitude: number | null
  longitude: number | null
  title: string
}) {
  const userCoords = useUserCoordinates()

  useEffect(() => {
    void configureLeafletIcons()
  }, [])

  const distanceLabel = useMemo(() => {
    const enriched = addDistanceToListings(
      [{ latitude, longitude }],
      userCoords,
    )
    return enriched[0]?.distanceLabel
  }, [latitude, longitude, userCoords])

  const hasCoords = latitude !== null && longitude !== null
  const mapCenter = hasCoords
    ? ([latitude, longitude] as [number, number])
    : getDefaultMapCenter(userCoords)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <MapPin className='h-5 w-5 text-[#FF385C]' />
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {distanceLabel ? (
          <p className='text-sm text-neutral-600'>A {distanceLabel.replace(' de vos', '')} de vos</p>
        ) : (
          <p className='text-sm text-neutral-600'>
            Activá tu ubicación para ver la distancia a este listing.
          </p>
        )}

        {hasCoords ? (
          <div className='h-[200px] overflow-hidden rounded-xl'>
            <LeafletMapContainer
              center={mapCenter}
              zoom={14}
              className='h-full w-full'
              scrollWheelZoom={false}
              dragging={false}
              zoomControl={false}
            >
              <LeafletTileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
              <LeafletMarker position={[latitude, longitude]} />
            </LeafletMapContainer>
          </div>
        ) : (
          <p className='rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500'>
            Este listing no tiene coordenadas registradas.
          </p>
        )}

        <div className='flex flex-wrap gap-2'>
          <Button type='button' variant='outline' disabled className='rounded-full' title='Próximamente'>
            <Navigation className='mr-2 h-4 w-4' />
            Cómo llegar
          </Button>
          <Button type='button' variant='outline' disabled className='rounded-full' title='Próximamente'>
            <Truck className='mr-2 h-4 w-4' />
            Estimación de entrega
          </Button>
        </div>
        <p className='text-xs text-neutral-400'>{title}</p>
      </CardContent>
    </Card>
  )
}
