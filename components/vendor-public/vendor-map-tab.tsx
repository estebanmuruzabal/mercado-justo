'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { MapPin } from 'lucide-react'

import { configureLeafletIcons } from '@/lib/location/leaflet-config'

import 'leaflet/dist/leaflet.css'

const LeafletMapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false })
const LeafletTileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false })
const LeafletMarker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false })

export function VendorMapTab({
  latitude,
  longitude,
  address,
  name,
}: {
  latitude: number | null
  longitude: number | null
  address: string | null
  name: string
}) {
  useEffect(() => {
    void configureLeafletIcons()
  }, [])

  const hasCoords = latitude !== null && longitude !== null

  if (!hasCoords) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-16 text-center'>
        <MapPin className='h-10 w-10 text-neutral-400' />
        <p className='text-sm text-neutral-500'>Esta tienda no registró una ubicación.</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {address ? (
        <p className='flex items-center gap-2 text-sm text-neutral-700'>
          <MapPin className='h-4 w-4 text-neutral-400' />
          {address}
        </p>
      ) : null}
      <div className='h-[360px] overflow-hidden rounded-2xl border border-neutral-200'>
        <LeafletMapContainer
          center={[latitude as number, longitude as number]}
          zoom={14}
          className='h-full w-full'
          scrollWheelZoom={false}
        >
          <LeafletTileLayer
            attribution='&copy; OpenStreetMap contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          <LeafletMarker position={[latitude as number, longitude as number]} title={name} />
        </LeafletMapContainer>
      </div>
    </div>
  )
}
