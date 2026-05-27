'use client'

import { RESISTENCIA_CENTER } from '@/lib/location/leaflet-config'
import { useUserLocationStore, useUserCoordinates } from '@/stores/useUserLocationStore'
import { useMarketplaceFiltersStore } from '@/stores/useMarketplaceFiltersStore'

/** @deprecated Use useUserLocationStore directly. Kept for gradual migration. */
export function useUserLocation() {
  const latitude = useUserLocationStore((s) => s.latitude)
  const longitude = useUserLocationStore((s) => s.longitude)
  const loading = useUserLocationStore((s) => s.loading)
  const radiusKm = useMarketplaceFiltersStore((s) => s.radiusKm)
  const setRadiusKm = useMarketplaceFiltersStore((s) => s.setRadiusKm)
  const permissionStatus = useUserLocationStore((s) => s.permissionStatus)
  const error = useUserLocationStore((s) => s.error)
  const requestLocation = useUserLocationStore((s) => s.requestLocation)
  const setLocation = useUserLocationStore((s) => s.setLocation)

  const status =
    loading ? 'requesting' : permissionStatus === 'prompt' ? 'requesting' : permissionStatus

  return {
    selectedCity: latitude !== null ? 'Tu ubicación' : null,
    radiusKm,
    coordinates:
      latitude !== null && longitude !== null ? { latitude, longitude } : null,
    status,
    errorMessage: error,
    setCity: (city: string | null) => {
      if (city) {
        setLocation(RESISTENCIA_CENTER.latitude, RESISTENCIA_CENTER.longitude, 'manual')
      }
    },
    setRadiusKm,
    requestBrowserLocation: requestLocation,
    setLocation,
  }
}

export type { Coordinates as UserCoordinates } from '@/lib/location/coordinates'

export { useUserCoordinates }
