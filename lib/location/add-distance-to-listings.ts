import type { Coordinates } from './coordinates'
import { isFiniteLatLng } from './coordinates'
import { haversineDistanceKm } from './distance'

export type WithCoords = {
  latitude: number | null
  longitude: number | null
}

export type WithDistance<T> = T & {
  distanceKm: number | null
  distanceLabel: string | null
}

export function formatDistanceLabel(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000)
    return `${meters} m de vos`
  }
  return `${distanceKm.toFixed(1)} km de vos`
}

export function addDistanceToListings<T extends WithCoords>(
  listings: T[],
  user: Coordinates | null,
): WithDistance<T>[] {
  if (!isFiniteLatLng(user)) {
    return listings.map((listing) => ({
      ...listing,
      distanceKm: null,
      distanceLabel: null,
    }))
  }

  return listings.map((listing) => {
    const listingCoords = {
      latitude: listing.latitude,
      longitude: listing.longitude,
    }

    if (!isFiniteLatLng(listingCoords)) {
      return {
        ...listing,
        distanceKm: null,
        distanceLabel: null,
      }
    }

    const distanceKm = haversineDistanceKm(user, listingCoords)
    return {
      ...listing,
      distanceKm,
      distanceLabel: formatDistanceLabel(distanceKm),
    }
  })
}
