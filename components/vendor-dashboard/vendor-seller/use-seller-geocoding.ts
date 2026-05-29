'use client'

import { useEffect, useState } from 'react'

import { geocodeAddressToLatLng } from '@/server/actions/geocode-address.actions'
import type { UseFormSetValue } from 'react-hook-form'

export function useSellerGeocoding({
  address,
  coordMode,
  setValue,
  toast,
}: {
  address: string
  coordMode: 'auto' | 'map'
  setValue: UseFormSetValue<{ latitude: string; longitude: string }>
  toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => void
}) {
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    if (coordMode !== 'auto') return
    if (!address.trim()) return

    let cancelled = false
    const t = window.setTimeout(async () => {
      try {
        setGeocoding(true)
        const result = await geocodeAddressToLatLng({ address })
        if (cancelled) return
        setValue('latitude', String(result.latitude), { shouldDirty: true, shouldValidate: true })
        setValue('longitude', String(result.longitude), { shouldDirty: true, shouldValidate: true })
      } catch (e) {
        if (cancelled) return
        const message = e instanceof Error ? e.message : 'No se pudo geocodificar.'
        toast({ title: 'Error', description: message, variant: 'destructive' })
      } finally {
        if (!cancelled) setGeocoding(false)
      }
    }, 700)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [address, coordMode, setValue, toast])

  return { geocoding }
}

