'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export function MapViewSync({
  center,
  zoom,
  fly = true,
}: {
  center: [number, number]
  zoom: number
  fly?: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (fly) {
      map.flyTo(center, zoom, { duration: 0.8 })
      return
    }
    map.setView(center, zoom)
  }, [map, center, zoom, fly])

  return null
}
