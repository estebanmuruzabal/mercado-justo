export type LocationPrivacyMode = 'exact' | 'radius' | 'city'

export type LocationPrivacy = { mode: 'exact' } | { mode: 'radius'; radiusMeters: number } | { mode: 'city' }

/** Reference tick marks on the slider (not snap points). */
export const LOCATION_REFERENCE_RADIUS_METERS = [50, 100, 500, 1000] as const

export const MIN_PUBLIC_RADIUS_METERS = 15
export const MAX_PUBLIC_RADIUS_METERS = 5000

/** Slider: 0 = exact, 1..919 = radius, 920..1000 = city. */
export const LOCATION_SLIDER_MAX = 1000
export const LOCATION_SLIDER_CITY_START = 920

const LEGACY_PRECISION_TO_RADIUS: Record<string, number | null> = {
  exact: 0,
  '50m': 50,
  '100m': 100,
  '500m': 500,
  '1km': 1000,
  city: null,
  radius: null,
}

export function isLocationPrivacyMode(value: string): value is LocationPrivacyMode {
  return value === 'exact' || value === 'radius' || value === 'city'
}

export function formatLocationPrivacyLabel(privacy: LocationPrivacy): string {
  if (privacy.mode === 'exact') return 'Exacta'
  if (privacy.mode === 'city') return 'Ciudad'
  if (privacy.radiusMeters >= 1000) {
    const km = privacy.radiusMeters / 1000
    return Number.isInteger(km) ? `${km} km` : `~${km.toFixed(1)} km`
  }
  return `${privacy.radiusMeters} m`
}

export function locationPrivacyFromStorage(input: {
  locationPrecision: string
  locationRadiusMeters: number | null
}): LocationPrivacy {
  const { locationPrecision, locationRadiusMeters } = input

  if (locationPrecision === 'city' || (locationRadiusMeters === null && locationPrecision !== 'exact' && locationPrecision !== 'radius')) {
    return { mode: 'city' }
  }

  if (locationPrecision === 'exact' || locationRadiusMeters === 0) {
    return { mode: 'exact' }
  }

  if (locationRadiusMeters != null && locationRadiusMeters > 0) {
    return { mode: 'radius', radiusMeters: locationRadiusMeters }
  }

  const legacyRadius = LEGACY_PRECISION_TO_RADIUS[locationPrecision]
  if (legacyRadius === null) return { mode: 'city' }
  if (legacyRadius === 0) return { mode: 'exact' }
  return { mode: 'radius', radiusMeters: legacyRadius }
}

export function locationPrivacyToStorage(privacy: LocationPrivacy): {
  locationPrecision: LocationPrivacyMode
  locationRadiusMeters: number | null
} {
  if (privacy.mode === 'city') {
    return { locationPrecision: 'city', locationRadiusMeters: null }
  }
  if (privacy.mode === 'exact') {
    return { locationPrecision: 'exact', locationRadiusMeters: 0 }
  }
  return {
    locationPrecision: 'radius',
    locationRadiusMeters: clampRadiusMeters(privacy.radiusMeters),
  }
}

export function clampRadiusMeters(radiusMeters: number): number {
  return Math.round(
    Math.max(MIN_PUBLIC_RADIUS_METERS, Math.min(MAX_PUBLIC_RADIUS_METERS, radiusMeters)),
  )
}

function radiusToSliderT(radiusMeters: number): number {
  const clamped = clampRadiusMeters(radiusMeters)
  return (
    Math.log(clamped / MIN_PUBLIC_RADIUS_METERS) /
    Math.log(MAX_PUBLIC_RADIUS_METERS / MIN_PUBLIC_RADIUS_METERS)
  )
}

export function sliderValueFromLocationPrivacy(privacy: LocationPrivacy): number {
  if (privacy.mode === 'exact') return 0
  if (privacy.mode === 'city') return LOCATION_SLIDER_MAX
  const span = LOCATION_SLIDER_CITY_START - 2
  return 1 + Math.round(radiusToSliderT(privacy.radiusMeters) * span)
}

export function locationPrivacyFromSliderValue(value: number): LocationPrivacy {
  const clamped = Math.max(0, Math.min(LOCATION_SLIDER_MAX, Math.round(value)))

  if (clamped <= 0) return { mode: 'exact' }
  if (clamped >= LOCATION_SLIDER_CITY_START) return { mode: 'city' }

  const span = LOCATION_SLIDER_CITY_START - 2
  const t = (clamped - 1) / span
  const radiusMeters = clampRadiusMeters(
    MIN_PUBLIC_RADIUS_METERS * Math.pow(MAX_PUBLIC_RADIUS_METERS / MIN_PUBLIC_RADIUS_METERS, t),
  )

  return { mode: 'radius', radiusMeters }
}

export function referenceLabelSliderPercent(radiusMeters: number): number {
  return (sliderValueFromLocationPrivacy({ mode: 'radius', radiusMeters }) / LOCATION_SLIDER_MAX) * 100
}

export function isValidLatitude(latitude: number): boolean {
  return latitude >= -90 && latitude <= 90 && !Number.isNaN(latitude)
}

export function isValidLongitude(longitude: number): boolean {
  return longitude >= -180 && longitude <= 180 && !Number.isNaN(longitude)
}

export function formatCityLabel(city: string | null, province: string | null): string {
  const parts = [city?.trim(), province?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Ubicación no identificada'
}

export type PublicLocationPreview =
  | { mode: 'pin'; latitude: number; longitude: number }
  | { mode: 'circle'; latitude: number; longitude: number; radiusMeters: number }
  | { mode: 'city'; label: string }

export function buildPublicLocationPreview(input: {
  latitude: number | null
  longitude: number | null
  locationPrivacy: LocationPrivacy
  city: string | null
  province: string | null
}): PublicLocationPreview | null {
  const { latitude, longitude, locationPrivacy, city, province } = input

  if (locationPrivacy.mode === 'city') {
    return { mode: 'city', label: formatCityLabel(city, province) }
  }

  if (latitude == null || longitude == null) return null
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null

  if (locationPrivacy.mode === 'radius') {
    return {
      mode: 'circle',
      latitude,
      longitude,
      radiusMeters: locationPrivacy.radiusMeters,
    }
  }

  return { mode: 'pin', latitude, longitude }
}
