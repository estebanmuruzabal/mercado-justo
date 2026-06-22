'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { updateUserLocationSettingsAction } from '@/domains/users/application/actions/update-user-location.actions'
import type { UserLocationSettingsDto } from '@/domains/users/application/dto/user-location.dto'
import {
  buildPublicLocationPreview,
  type LocationPrivacy,
} from '@/domains/users/domain/user-location'
import { useDebouncedValue } from '@/domains/marketplace/listings/presentation/components/listing-manager/step1/use-debounced-value'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type LocalSettings = UserLocationSettingsDto

function coordsEqual(
  a: { latitude: number | null; longitude: number | null },
  b: { latitude: number | null; longitude: number | null },
) {
  return a.latitude === b.latitude && a.longitude === b.longitude
}

function privacyEqual(a: LocationPrivacy, b: LocationPrivacy): boolean {
  if (a.mode !== b.mode) return false
  if (a.mode === 'radius' && b.mode === 'radius') return a.radiusMeters === b.radiusMeters
  return true
}

export function useUserLocationSettings(initialSettings: UserLocationSettingsDto) {
  const [settings, setSettings] = useState<LocalSettings>(initialSettings)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const lastSavedRef = useRef<LocalSettings>(initialSettings)
  const isFirstRender = useRef(true)

  const debouncedSettings = useDebouncedValue(settings, 500)

  const preview = useMemo(
    () =>
      buildPublicLocationPreview({
        latitude: settings.latitude,
        longitude: settings.longitude,
        locationPrivacy: settings.locationPrivacy,
        city: settings.city,
        province: settings.province,
      }),
    [settings],
  )

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const last = lastSavedRef.current
    const next = debouncedSettings

    const patch: Parameters<typeof updateUserLocationSettingsAction>[0] = {}
    if (!coordsEqual(next, last)) {
      patch.latitude = next.latitude
      patch.longitude = next.longitude
    }
    if (next.locationVisibility !== last.locationVisibility) {
      patch.locationVisibility = next.locationVisibility
    }
    if (!privacyEqual(next.locationPrivacy, last.locationPrivacy)) {
      patch.locationPrivacy = next.locationPrivacy
    }

    if (Object.keys(patch).length === 0) return

    setSaveStatus('saving')
    setSaveError(null)

    void (async () => {
      try {
        const saved = await updateUserLocationSettingsAction({
          ...patch,
          skipGeocode: patch.latitude === undefined && patch.longitude === undefined,
        })
        lastSavedRef.current = saved
        setSettings(saved)
        setSaveStatus('saved')
      } catch (err) {
        setSaveStatus('error')
        setSaveError(err instanceof Error ? err.message : 'No se pudo guardar la ubicación.')
      }
    })()
  }, [debouncedSettings])

  function setCoordinates(coords: { latitude: number; longitude: number }) {
    setSettings((current) => ({
      ...current,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }))
  }

  function setLocationVisibility(locationVisibility: boolean) {
    setSettings((current) => ({ ...current, locationVisibility }))
  }

  function setLocationPrivacy(locationPrivacy: LocationPrivacy) {
    setSettings((current) => ({ ...current, locationPrivacy }))
  }

  return {
    settings,
    preview,
    saveStatus,
    saveError,
    setCoordinates,
    setLocationVisibility,
    setLocationPrivacy,
  }
}
