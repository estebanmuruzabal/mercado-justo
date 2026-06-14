import type { Coordinates } from './coordinates'

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

// Prepared for future “radio/cercanía” search.
// Not used yet for ranking/querying.
export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

