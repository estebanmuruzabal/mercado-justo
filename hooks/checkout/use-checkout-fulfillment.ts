'use client'

import { useMemo } from 'react'

import { useLocationStore } from '@/stores/location.store'
import { useCheckoutStore } from '@/stores/checkout.store'
import type { CheckoutFulfillmentInput, LocationSnapshot } from '@/lib/checkout/types'

export function useLocationSnapshot(): LocationSnapshot {
  const mode = useLocationStore((s) => s.mode)
  const address = useLocationStore((s) => s.address)
  const latitude = useLocationStore((s) => s.latitude)
  const longitude = useLocationStore((s) => s.longitude)
  const city = useLocationStore((s) => s.city)
  const province = useLocationStore((s) => s.province)

  return useMemo(
    () => ({ mode, address, latitude, longitude, city, province }),
    [mode, address, latitude, longitude, city, province],
  )
}

export function useCheckoutFulfillmentInput(sellerHasAddress: boolean): CheckoutFulfillmentInput {
  const location = useLocationSnapshot()
  const pickupSubOption = useCheckoutStore((s) => s.pickupSubOption)
  const selectedPickupHubId = useCheckoutStore((s) => s.selectedPickupHubId)

  return useMemo(
    () => ({
      location,
      pickupSubOption,
      selectedPickupHubId,
      sellerHasAddress,
    }),
    [location, pickupSubOption, selectedPickupHubId, sellerHasAddress],
  )
}
