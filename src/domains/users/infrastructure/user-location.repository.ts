import { createClient } from '@/shared/database/supabase/server'

import type { UpdateUserLocationSettingsInput, UserLocationSettingsDto } from '../application/dto/user-location.dto'
import { locationPrivacyFromStorage, locationPrivacyToStorage } from '../domain/user-location'

type UserLocationRow = {
  location_lat: number | null
  location_lng: number | null
  location_visibility: boolean
  location_precision: string
  location_radius_meters: number | null
  location_city: string | null
  location_province: string | null
}

const LOCATION_SELECT =
  'location_lat, location_lng, location_visibility, location_precision, location_radius_meters, location_city, location_province'

function mapRow(row: UserLocationRow): UserLocationSettingsDto {
  return {
    latitude: row.location_lat,
    longitude: row.location_lng,
    locationVisibility: row.location_visibility,
    locationPrivacy: locationPrivacyFromStorage({
      locationPrecision: row.location_precision,
      locationRadiusMeters: row.location_radius_meters,
    }),
    city: row.location_city,
    province: row.location_province,
  }
}

export async function findUserLocationSettings(userId: string): Promise<UserLocationSettingsDto | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user')
    .select(LOCATION_SELECT)
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapRow(data as UserLocationRow)
}

export async function updateUserLocationSettings(
  userId: string,
  input: UpdateUserLocationSettingsInput,
): Promise<UserLocationSettingsDto> {
  const supabase = await createClient()

  const patch: Record<string, unknown> = {}
  if (input.latitude !== undefined) patch.location_lat = input.latitude
  if (input.longitude !== undefined) patch.location_lng = input.longitude
  if (input.locationVisibility !== undefined) patch.location_visibility = input.locationVisibility
  if (input.locationPrivacy !== undefined) {
    const stored = locationPrivacyToStorage(input.locationPrivacy)
    patch.location_precision = stored.locationPrecision
    patch.location_radius_meters = stored.locationRadiusMeters
  }
  if (input.city !== undefined) patch.location_city = input.city
  if (input.province !== undefined) patch.location_province = input.province

  const { data, error } = await supabase
    .from('user')
    .update(patch as never)
    .eq('id', userId)
    .select(LOCATION_SELECT)
    .single()

  if (error) throw error

  return mapRow(data as UserLocationRow)
}
