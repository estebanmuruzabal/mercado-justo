'use client'

import { useCallback, useMemo, useState } from 'react'

import type { LatLng } from '@/lib/location/location-types'
import { isWithinResistencia } from '@/lib/location/validate-resistencia'

export type BrowserGeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'

export function useBrowserGeolocation() {
  const [status, setStatus] = useState<BrowserGeoStatus>('idle')
  const [coords, setCoords] = useState<LatLng | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback((): Promise<LatLng> => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      const msg = 'Geolocalización no disponible.'
      setStatus('error')
      setError(msg)
      return Promise.reject(new Error(msg))
    }

    setStatus('requesting')
    setError(null)

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          if (!isWithinResistencia(next)) {
            const msg = 'Disculpe, pero todavía no llegamos a esa ubicación.'
            setStatus('error')
            setError(msg)
            return reject(new Error(msg))
          }

          setCoords(next)
          setStatus('granted')
          resolve(next)
        },
        (err) => {
          const msg =
            err.code === err.PERMISSION_DENIED
              ? 'Permiso de ubicación denegado.'
              : err.message || 'No se pudo obtener tu ubicación.'
          setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
          setError(msg)
          reject(new Error(msg))
        },
        { enableHighAccuracy: true, timeout: 10_000 },
      )
    })
  }, [])

  return useMemo(
    () => ({
      status,
      coords,
      error,
      requestLocation,
    }),
    [status, coords, error, requestLocation],
  )
}

