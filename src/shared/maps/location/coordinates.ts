export type Coordinates = {
  latitude: number
  longitude: number
}

export function isFiniteLatLng(value: Partial<Coordinates> | null | undefined): value is Coordinates {
  if (!value) return false
  const { latitude, longitude } = value
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

