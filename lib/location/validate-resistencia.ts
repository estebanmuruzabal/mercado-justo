import type { LatLng } from './location-types'

export const RESISTENCIA_LABEL = 'Resistencia' as const
export const CHACO_LABEL = 'Chaco' as const

// Approx bounding box for Resistencia, Chaco (Argentina).
export const RESISTENCIA_BOUNDS = {
  south: -27.70,
  north: -27.30,
  west: -59.30,
  east: -58.60,
} as const

export function isWithinResistencia(latLng: LatLng | null): boolean {
  if (!latLng) return false
  const { latitude, longitude } = latLng

  return (
    latitude >= RESISTENCIA_BOUNDS.south &&
    latitude <= RESISTENCIA_BOUNDS.north &&
    longitude >= RESISTENCIA_BOUNDS.west &&
    longitude <= RESISTENCIA_BOUNDS.east
  )
}

export function assertWithinResistencia(latLng: LatLng): void {
  if (!isWithinResistencia(latLng)) {
    throw new Error('La ubicación no parece estar en Resistencia, Chaco.')
  }
}

