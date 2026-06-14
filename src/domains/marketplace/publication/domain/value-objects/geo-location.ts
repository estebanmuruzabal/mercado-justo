export type LocationMode = 'physical' | 'remote' | 'hybrid' | 'none'

export type GeoLocation = {
  mode: LocationMode
  latitude: number | null
  longitude: number | null
  regionCode?: string | null
}

export function geoFromListingRow(row: {
  latitude: number | null
  longitude: number | null
}): GeoLocation {
  const hasCoords = row.latitude !== null && row.longitude !== null
  return {
    mode: hasCoords ? 'physical' : 'none',
    latitude: row.latitude,
    longitude: row.longitude,
  }
}
