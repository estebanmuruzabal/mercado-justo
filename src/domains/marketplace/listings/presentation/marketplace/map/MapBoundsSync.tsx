'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

import type { MapBounds } from '@/domains/marketplace/listings/presentation/stores/useMarketplaceFiltersStore'
import { useMarketplaceFiltersStore } from '@/domains/marketplace/listings/presentation/stores/useMarketplaceFiltersStore'

function boundsChanged(a: MapBounds | null, b: MapBounds): boolean {
  if (!a) return true
  const epsilon = 0.0001
  return (
    Math.abs(a.north - b.north) > epsilon ||
    Math.abs(a.south - b.south) > epsilon ||
    Math.abs(a.east - b.east) > epsilon ||
    Math.abs(a.west - b.west) > epsilon
  )
}

export function MapBoundsSync() {
  const map = useMap()
  const setMapBounds = useMarketplaceFiltersStore((s) => s.setMapBounds)
  const currentBoundsRef = useRef<MapBounds | null>(null)

  useEffect(() => {
    function syncBounds() {
      const bounds = map.getBounds()
      const next: MapBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      }

      if (!boundsChanged(currentBoundsRef.current, next)) return

      currentBoundsRef.current = next
      setMapBounds(next)
    }

    syncBounds()
    map.on('moveend', syncBounds)
    return () => {
      map.off('moveend', syncBounds)
    }
  }, [map, setMapBounds])

  return null
}
