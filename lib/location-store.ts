'use client'

import type { PropsWithChildren } from 'react'
import React, { createContext, useCallback, useMemo, useReducer } from 'react'

export type UserCoordinates = {
  latitude: number
  longitude: number
}

export type UserLocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'

export type UserLocationState = {
  selectedCity: string | null
  coordinates: UserCoordinates | null
  radiusKm: number
  status: UserLocationStatus
  errorMessage: string | null
}

type Action =
  | { type: 'setCity'; city: string | null }
  | { type: 'setCoordinates'; coordinates: UserCoordinates }
  | { type: 'setRadiusKm'; radiusKm: number }
  | { type: 'setStatus'; status: UserLocationStatus; errorMessage?: string | null }

const DEFAULT_STATE: UserLocationState = {
  selectedCity: null,
  coordinates: null,
  radiusKm: 10,
  status: 'idle',
  errorMessage: null,
}

function reducer(state: UserLocationState, action: Action): UserLocationState {
  switch (action.type) {
    case 'setCity':
      return { ...state, selectedCity: action.city }
    case 'setCoordinates':
      return { ...state, coordinates: action.coordinates, status: 'granted', errorMessage: null }
    case 'setRadiusKm':
      return { ...state, radiusKm: action.radiusKm }
    case 'setStatus':
      return { ...state, status: action.status, errorMessage: action.errorMessage ?? null }
    default:
      return state
  }
}

export type LocationStoreValue = {
  state: UserLocationState
  actions: {
    setCity: (city: string | null) => void
    setRadiusKm: (radiusKm: number) => void
    requestBrowserLocation: () => void
  }
}

export const LocationStoreContext = createContext<LocationStoreValue | null>(null)

function getDeniedLabel(err: GeolocationPositionError): string {
  // Keep user-facing strings subtle; UI can decide whether to display.
  if (err.code === err.PERMISSION_DENIED) return 'Permiso de ubicación denegado.'
  if (err.code === err.POSITION_UNAVAILABLE) return 'Ubicación no disponible.'
  return 'No pudimos obtener tu ubicación.'
}

export function LocationStoreProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE)

  const setCity = useCallback((city: string | null) => dispatch({ type: 'setCity', city }), [])
  const setRadiusKm = useCallback((radiusKm: number) => dispatch({ type: 'setRadiusKm', radiusKm }), [])

  const requestBrowserLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      dispatch({ type: 'setStatus', status: 'error', errorMessage: 'Geolocalización no disponible.' })
      return
    }

    dispatch({ type: 'setStatus', status: 'requesting', errorMessage: null })

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch({
          type: 'setCoordinates',
          coordinates: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        })
      },
      (err) => {
        dispatch({
          type: 'setStatus',
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
          errorMessage: getDeniedLabel(err),
        })
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
    )
  }, [])

  const value = useMemo<LocationStoreValue>(
    () => ({
      state,
      actions: {
        setCity,
        setRadiusKm,
        requestBrowserLocation,
      },
    }),
    [state, setCity, setRadiusKm, requestBrowserLocation],
  )

  return React.createElement(LocationStoreContext.Provider, { value }, children)
}

