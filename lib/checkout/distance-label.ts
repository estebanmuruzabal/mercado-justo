import { formatDistanceLabel } from '@/lib/location/add-distance-to-listings'
import { haversineDistanceKm } from '@/lib/location/distance'

export function formatDistanceFromUser(
  userLat: number | null,
  userLng: number | null,
  targetLat: number | null,
  targetLng: number | null,
): string | null {
  if (
    userLat === null ||
    userLng === null ||
    targetLat === null ||
    targetLng === null
  ) {
    return null
  }
  const km = haversineDistanceKm(
    { latitude: userLat, longitude: userLng },
    { latitude: targetLat, longitude: targetLng },
  )
  return formatDistanceLabel(km).replace(' de vos', '')
}
