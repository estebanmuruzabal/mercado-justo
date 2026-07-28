'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { reverseGeocodeToAddress } from '@/shared/maps/geocoding/reverse-geocode.actions'
import { useLocationStore } from '@/shared/maps/location/presentation/stores/location.store'
import type { LatLng, LocationMode, LocationSelection } from '@/shared/maps/location/location-types'
import { useBrowserGeolocation } from './use-browser-geolocation'

export type LocationFlowStep = 'mode' | 'search' | 'confirm' | 'adjust'

function normalizeAddress(value: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function useLocation() {
  const onboardingSeen = useLocationStore((s) => s.onboardingSeen)
  const mode = useLocationStore((s) => s.mode)
  const draft = useLocationStore((s) => s.draft)
  const selectPickup = useLocationStore((s) => s.selectPickup)
  const selectDelivery = useLocationStore((s) => s.selectDelivery)
  const updateAddressDraft = useLocationStore((s) => s.updateAddressDraft)
  const markOnboardingSeen = useLocationStore((s) => s.markOnboardingSeen)

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<LocationFlowStep>('mode')
  const [showOnboardingPopover, setShowOnboardingPopover] = useState(false)

  const [reverseAddress, setReverseAddress] = useState<string | null>(null)

  const { requestLocation, error: geoError, status: geoStatus } = useBrowserGeolocation()

  // Mismatch: si el usuario editó el address manualmente, lo vemos comparando contra el último reverse geocode.
  const isAddressMismatch = useMemo(() => {
    const drafted = normalizeAddress(draft.address)
    const reversed = normalizeAddress(reverseAddress)
    if (!reversed) return false
    return drafted !== reversed
  }, [draft.address, reverseAddress])

  const close = useCallback(() => {
    setIsOpen(false)
    setShowOnboardingPopover(false)
    setStep('mode')
  }, [])

  const open = useCallback(() => {
    if (!onboardingSeen) {
      setShowOnboardingPopover(true)
      setIsOpen(true)
      setStep('mode')
      return
    }
    setShowOnboardingPopover(false)
    setIsOpen(true)
    setStep('mode')
  }, [onboardingSeen])

  /** Opens the "Elegí cómo querés recibir" dialog (skips onboarding popover). */
  const openReceiveModeChoice = useCallback(() => {
    setShowOnboardingPopover(false)
    setIsOpen(true)
    setStep('mode')
  }, [])

  const onUnderstood = useCallback(() => {
    markOnboardingSeen()
    setShowOnboardingPopover(false)
    setStep('mode')
  }, [markOnboardingSeen])

  const chooseMode = useCallback(
    (nextMode: LocationMode) => {
      if (nextMode === 'pickup') {
        selectPickup()
        close()
        return
      }

      // delivery
      setReverseAddress(null)
      updateAddressDraft({
        address: null,
        latitude: null,
        longitude: null,
        city: null,
        province: null,
        isInResistencia: false,
      })
      setStep('search')
    },
    [close, selectPickup, updateAddressDraft],
  )

  const setDraftFromReverse = useCallback(
    (selection: LocationSelection) => {
      setReverseAddress(selection.address)
      updateAddressDraft({
        address: selection.address,
        latitude: selection.latitude,
        longitude: selection.longitude,
        city: selection.city,
        province: selection.province,
        isInResistencia: true,
      })
    },
    [updateAddressDraft],
  )

  const setDraftFromLatLng = useCallback(
    async (latLng: LatLng) => {
      // No bloqueamos UI por el flag de error; la UI renderiza según draft.isInResistencia.
      const result = await reverseGeocodeToAddress(latLng)
      setDraftFromReverse({
        mode: 'delivery',
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        province: result.province,
      })
    },
    [setDraftFromReverse],
  )

  const onUseCurrentLocation = useCallback(async () => {
    const coords = await requestLocation()
    await setDraftFromLatLng(coords)
    setStep('confirm')
  }, [requestLocation, setDraftFromLatLng])

  const onContinueFromSearch = useCallback(() => {
    if (draft.latitude == null || draft.longitude == null) return
    if (!draft.isInResistencia) return
    // Si el address del draft ya fue set desde la selección, asumimos que coincide.
    setReverseAddress(draft.address)
    setStep('confirm')
  }, [draft.latitude, draft.longitude, draft.isInResistencia, draft.address])

  const onPinChange = useCallback(
    async (latLng: LatLng) => {
      await setDraftFromLatLng(latLng)
    },
    [setDraftFromLatLng],
  )

  const confirmDelivery = useCallback(() => {
    if (
      draft.address == null ||
      draft.latitude == null ||
      draft.longitude == null ||
      draft.city == null ||
      draft.province == null ||
      !draft.isInResistencia
    ) {
      return
    }

    const selection: LocationSelection = {
      mode: 'delivery',
      address: draft.address,
      latitude: draft.latitude,
      longitude: draft.longitude,
      city: draft.city,
      province: draft.province,
    }

    selectDelivery(selection)
    close()
  }, [close, draft.address, draft.city, draft.latitude, draft.longitude, draft.province, draft.isInResistencia, selectDelivery])

  const startAdjust = useCallback(() => {
    setStep('adjust')
  }, [])

  const backToSearch = useCallback(() => {
    setStep('search')
  }, [])

  const backToMode = useCallback(() => {
    setStep('mode')
  }, [])

  const cancelAdjust = useCallback(() => {
    setStep('confirm')
  }, [])

  // Evita actualizar selección si el flujo está cerrado.
  useEffect(() => {
    if (!isOpen) {
      setShowOnboardingPopover(false)
      setReverseAddress(null)
    }
  }, [isOpen])

  return {
    isOpen,
    step,
    showOnboardingPopover,
    onboardingSeen,
    mode,

    draft,
    isAddressMismatch,

    geoStatus,
    geoError,

    open,
    openReceiveModeChoice,
    close,
    onUnderstood,
    chooseMode,

    onUseCurrentLocation,
    onContinueFromSearch,
    onPinChange,
    confirmDelivery,
    startAdjust,
    backToSearch,
    backToMode,
    cancelAdjust,
    setDraftFromLatLng,
    setDraftFromReverse,
  }
}
