'use client'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

export const RESISTENCIA_CENTER = { latitude: -27.4705, longitude: -58.9868 } as const

export const RESISTENCIA_BOUNDS: [[number, number], [number, number]] = [
  [-27.7, -59.3],
  [-27.3, -58.6],
]

let iconConfigured = false
let leafletWithClusterPromise: Promise<typeof import('leaflet')> | null = null

export async function loadLeafletWithCluster() {
  if (typeof window === 'undefined') {
    throw new Error('Leaflet can only be loaded in the browser.')
  }

  if (!leafletWithClusterPromise) {
    leafletWithClusterPromise = (async () => {
      const leafletModule = await import('leaflet')
      const L = leafletModule.default

      // leaflet.markercluster UMD bundle patches global `L`, not the ESM namespace.
      if (typeof window !== 'undefined') {
        ;(window as typeof window & { L: typeof L }).L = L
      }

      await import('leaflet.markercluster')
      return L
    })()
  }

  return leafletWithClusterPromise
}

export async function configureLeafletIcons() {
  if (iconConfigured || typeof window === 'undefined') return
  const L = await loadLeafletWithCluster()
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src,
  })
  iconConfigured = true
}

export function getDefaultMapCenter(
  userCoords: { latitude: number; longitude: number } | null,
): [number, number] {
  if (userCoords) return [userCoords.latitude, userCoords.longitude]
  return [RESISTENCIA_CENTER.latitude, RESISTENCIA_CENTER.longitude]
}
