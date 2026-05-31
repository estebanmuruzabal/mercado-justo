'use client'

import { useCallback, useMemo } from 'react'

export type LatLng = { latitude: number | null; longitude: number | null }

export function useListingLocation({
  sellerLocation,
  onChange,
}: {
  sellerLocation: LatLng | null
  onChange: (next: LatLng) => void
}) {
  const canCopy = useMemo(() => {
    if (!sellerLocation) return false
    return sellerLocation.latitude != null && sellerLocation.longitude != null
  }, [sellerLocation])

  const copyFromSeller = useCallback(() => {
    if (!sellerLocation) return
    onChange({ latitude: sellerLocation.latitude, longitude: sellerLocation.longitude })
  }, [sellerLocation, onChange])

  return { canCopy, copyFromSeller }
}

