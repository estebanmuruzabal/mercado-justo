import { useContext } from 'react'
import { LocationStoreContext, type UserCoordinates } from '@/lib/location-store'

export function useUserLocation() {
  const ctx = useContext(LocationStoreContext)
  if (!ctx) {
    throw new Error('useUserLocation must be used within <LocationStoreProvider />')
  }

  const { state, actions } = ctx

  return {
    selectedCity: state.selectedCity,
    radiusKm: state.radiusKm,
    coordinates: state.coordinates,
    status: state.status,
    errorMessage: state.errorMessage,
    setCity: actions.setCity,
    setRadiusKm: actions.setRadiusKm,
    requestBrowserLocation: actions.requestBrowserLocation,
  }
}

export type { UserCoordinates }

