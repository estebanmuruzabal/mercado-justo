import type { LocationPrivacy } from '@/domains/users/domain/user-location'

export type UserLocationSettingsDto = {
  latitude: number | null
  longitude: number | null
  locationVisibility: boolean
  locationPrivacy: LocationPrivacy
  city: string | null
  province: string | null
}

export type UpdateUserLocationSettingsInput = {
  latitude?: number | null
  longitude?: number | null
  locationVisibility?: boolean
  locationPrivacy?: LocationPrivacy
  city?: string | null
  province?: string | null
}
