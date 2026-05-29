'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { AddressSuggestion } from '@/lib/location/location-types'
import { RESISTENCIA_BOUNDS, isWithinResistencia } from '@/lib/location/validate-resistencia'

export type AddressSearchStatus = 'idle' | 'loading' | 'error' | 'ready'

const VIEWBOX = `${RESISTENCIA_BOUNDS.west},${RESISTENCIA_BOUNDS.north},${RESISTENCIA_BOUNDS.east},${RESISTENCIA_BOUNDS.south}`

function toSuggestion(raw: unknown): AddressSuggestion | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const latitude = Number(obj.lat)
  const longitude = Number(obj.lon)
  const displayName = typeof obj.display_name === 'string' ? obj.display_name : null

  if (!displayName) return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const latLng = { latitude, longitude }
  if (!isWithinResistencia(latLng)) return null

  return {
    displayName,
    address: displayName,
    latitude,
    longitude,
  }
}

export function useAddressSearch() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<AddressSearchStatus>('idle')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [selected, setSelected] = useState<AddressSuggestion | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSearch = useMemo(() => query.trim().length >= 2, [query])

  const search = useCallback(async () => {
    const q = query.trim()
    if (!q) {
      setSuggestions([])
      setSelected(null)
      setStatus('idle')
      return
    }

    if (!canSearch) return

    setStatus('loading')
    setError(null)

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('format', 'json')
      url.searchParams.set('limit', '5')
      url.searchParams.set('q', `${q}, Resistencia, Chaco, Argentina`)
      url.searchParams.set('bounded', '1')
      url.searchParams.set('viewbox', VIEWBOX)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const res = await fetch(url.toString(), {
        signal: controller.signal,
      })

      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: unknown = await res.json()
      if (!Array.isArray(data)) throw new Error('Respuesta inválida')

      const next = data.map((item) => toSuggestion(item)).filter(Boolean) as AddressSuggestion[]

      setSuggestions(next)
      setStatus('ready')

      // Si hay sugerencias, mantén la selección; si no, vacía.
      if (next.length > 0) {
        setSelected((prev) => prev ?? next[0])
      } else {
        setSelected(null)
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error buscando la dirección.')
      setSuggestions([])
      setSelected(null)
    }
  }, [canSearch, query])

  useEffect(() => {
    if (!canSearch) {
      setSuggestions([])
      setSelected(null)
      setStatus('idle')
      return
    }

    const timer = window.setTimeout(() => {
      void search()
    }, 250)

    return () => window.clearTimeout(timer)
  }, [canSearch, query, search])

  const isQueryInResistencia = useMemo(() => {
    if (!canSearch) return true
    if (status === 'loading') return true
    if (suggestions.length > 0) return true
    return false
  }, [canSearch, status, suggestions.length])

  const outsideMessage = 'Disculpe, pero todavía no llegamos a esa ubicación.'

  const clear = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setSelected(null)
    setStatus('idle')
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    suggestions,
    selected,
    setSelected,
    status,
    error,
    isQueryInResistencia,
    outsideMessage,
    clear,
  }
}

