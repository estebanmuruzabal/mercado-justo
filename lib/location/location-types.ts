export type LocationMode = 'delivery' | 'pickup'

export type LatLng = {
  latitude: number
  longitude: number
}

export type LocationSelection = {
  mode: LocationMode
  address: string
  latitude: number
  longitude: number
  city: string
  province: string
}

export type LocationDraft = {
  // Siempre guardamos el address y lat/lng del draft para que la UI
  // pueda editar el input y el pin sin perder estado.
  address: string | null
  latitude: number | null
  longitude: number | null
  city: string | null
  province: string | null
  isInResistencia: boolean
}

export type AddressSuggestion = {
  displayName: string
  address: string
  latitude: number
  longitude: number
}

export type ReverseGeocodeResult = {
  address: string
  city: string
  province: string
  latitude: number
  longitude: number
}

