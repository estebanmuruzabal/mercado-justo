'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useMap } from 'react-leaflet'
import type { CircleMarker, FeatureGroup, MarkerClusterGroup } from 'leaflet'

import { buildListingPopupHtml } from './ListingMapPopup'
import { configureLeafletIcons, loadLeafletWithCluster } from '@/lib/location/leaflet-config'
import type { MarketplaceListingWithDistance } from '@/types/marketplace'

import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

type ClusterLayer = MarkerClusterGroup | FeatureGroup

export function ListingMapMarkers({
  listings,
  selectedId,
  onSelect,
  userCoords,
}: {
  listings: MarketplaceListingWithDistance[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  userCoords?: { latitude: number; longitude: number } | null
}) {
  const map = useMap()
  const clusterRef = useRef<ClusterLayer | null>(null)
  const userMarkerRef = useRef<CircleMarker | null>(null)
  const hasFitBoundsRef = useRef(false)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  const listingsKey = useMemo(
    () =>
      listings
        .filter((l) => l.latitude !== null && l.longitude !== null)
        .map((l) => l.id)
        .join('|'),
    [listings],
  )

  const userCoordsKey =
    userCoords === null || userCoords === undefined
      ? 'none'
      : `${userCoords.latitude},${userCoords.longitude}`

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        await configureLeafletIcons()
        const L = await loadLeafletWithCluster()
        if (cancelled) return

        if (clusterRef.current) {
          map.removeLayer(clusterRef.current)
          clusterRef.current = null
        }
        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current)
          userMarkerRef.current = null
        }

        const cluster: ClusterLayer =
          typeof L.markerClusterGroup === 'function'
            ? L.markerClusterGroup()
            : L.featureGroup()
        clusterRef.current = cluster

        listings.forEach((listing) => {
          if (listing.latitude === null || listing.longitude === null) return

          const marker = L.marker([listing.latitude, listing.longitude])
          marker.bindPopup(buildListingPopupHtml(listing))
          marker.on('click', () => onSelectRef.current?.(listing.id))
          if (selectedId === listing.id) {
            marker.openPopup()
          }
          cluster.addLayer(marker)
        })

        if (userCoords) {
          const userMarker = L.circleMarker([userCoords.latitude, userCoords.longitude], {
            radius: 8,
            color: '#FF385C',
            fillColor: '#FF385C',
            fillOpacity: 0.9,
          })
          map.addLayer(userMarker)
          userMarkerRef.current = userMarker
        }

        map.addLayer(cluster)

        const coords = listings
          .filter((l) => l.latitude !== null && l.longitude !== null)
          .map((l) => [l.latitude!, l.longitude!] as [number, number])

        if (coords.length > 0 && !hasFitBoundsRef.current) {
          map.fitBounds(coords, { padding: [40, 40], maxZoom: 14 })
          hasFitBoundsRef.current = true
        }
      } catch (error) {
        console.error('Failed to render marketplace map markers', error)
      }
    })()

    return () => {
      cancelled = true
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current)
        clusterRef.current = null
      }
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current)
        userMarkerRef.current = null
      }
    }
  }, [listings, listingsKey, map, selectedId, userCoords, userCoordsKey])

  return null
}
