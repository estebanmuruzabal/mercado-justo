'use client'

import { useCallback, useMemo, useState } from 'react'

export type GlobalGeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 25_000,
  maximumAge: 120_000,
}

export function useGlobalGeolocation() {
  const [status, setStatus] = useState<GlobalGeoStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback((): Promise<{ latitude: number; longitude: number }> => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      const msg = 'Geolocalización no disponible en este dispositivo.'
      setStatus('error')
      setError(msg)
      return Promise.reject(new Error(msg))
    }

    if (!window.isSecureContext) {
      const msg = 'La ubicación solo funciona en HTTPS o localhost.'
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
          setStatus('granted')
          setError(null)
          resolve(next)
        },
        (err) => {
          let msg = 'No se pudo obtener tu ubicación.'
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Permiso de ubicación denegado.'
            setStatus('denied')
          } else if (err.code === err.TIMEOUT) {
            msg = 'Tardó demasiado en obtener tu ubicación. Probá de nuevo o marcá el punto en el mapa.'
            setStatus('error')
          } else {
            setStatus('error')
          }
          setError(msg)
          reject(new Error(msg))
        },
        GEO_OPTIONS,
      )
    })
  }, [])

  return useMemo(
    () => ({
      status,
      error,
      requestLocation,
    }),
    [status, error, requestLocation],
  )
}
