'use client'

import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LocationSource = 'browser' | 'manual'
export type PermissionStatus = 'idle' | 'prompt' | 'granted' | 'denied' | 'error'

type PersistedLocation = {
  latitude: number | null
  longitude: number | null
  source: LocationSource | null
}

type UserLocationState = PersistedLocation & {
  permissionStatus: PermissionStatus
  loading: boolean
  error: string | null
  requestLocation: () => void
  setLocation: (latitude: number, longitude: number, source: LocationSource) => void
  clearLocation: () => void
}

function getDeniedLabel(err: GeolocationPositionError): string {
  if (err.code === err.PERMISSION_DENIED) return 'Permiso de ubicación denegado.'
  if (err.code === err.POSITION_UNAVAILABLE) return 'Ubicación no disponible.'
  return 'No pudimos obtener tu ubicación.'
}

export const useUserLocationStore = create<UserLocationState>()(
  persist(
    (set) => ({
      latitude: null,
      longitude: null,
      source: null,
      permissionStatus: 'idle',
      loading: false,
      error: null,

      requestLocation: () => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
          set({
            permissionStatus: 'error',
            loading: false,
            error: 'Geolocalización no disponible.',
          })
          return
        }

        set({ loading: true, error: null, permissionStatus: 'prompt' })

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            set({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              source: 'browser',
              permissionStatus: 'granted',
              loading: false,
              error: null,
            })
          },
          (err) => {
            set({
              permissionStatus: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
              loading: false,
              error: getDeniedLabel(err),
            })
          },
          { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
        )
      },

      setLocation: (latitude, longitude, source) => {
        set({
          latitude,
          longitude,
          source,
          permissionStatus: 'granted',
          loading: false,
          error: null,
        })
      },

      clearLocation: () => {
        set({
          latitude: null,
          longitude: null,
          source: null,
          permissionStatus: 'idle',
          loading: false,
          error: null,
        })
      },
    }),
    {
      name: 'mercado-justo.user-location',
      partialize: (state) => ({
        latitude: state.latitude,
        longitude: state.longitude,
        source: state.source,
      }),
    },
  ),
)

export function useUserCoordinates() {
  const latitude = useUserLocationStore((s) => s.latitude)
  const longitude = useUserLocationStore((s) => s.longitude)

  return useMemo(() => {
    if (latitude === null || longitude === null) return null
    return { latitude, longitude }
  }, [latitude, longitude])
}

export function useUserLocationActions() {
  const requestLocation = useUserLocationStore((s) => s.requestLocation)
  const setLocation = useUserLocationStore((s) => s.setLocation)
  const clearLocation = useUserLocationStore((s) => s.clearLocation)

  return useMemo(
    () => ({ requestLocation, setLocation, clearLocation }),
    [requestLocation, setLocation, clearLocation],
  )
}
