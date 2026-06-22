'use server'

import { z } from 'zod'

import { createClient } from '@/shared/database/supabase/server'

import type { UserLocationSettingsDto } from '../dto/user-location.dto'
import {
  isValidLatitude,
  isValidLongitude,
} from '../../domain/user-location'
import { updateUserLocationSettings } from '../../infrastructure/user-location.repository'
import { reverseGeocodeUserLocation } from './reverse-geocode-user-location.actions'

const locationPrivacySchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('exact') }),
  z.object({
    mode: z.literal('radius'),
    radiusMeters: z.number().int().min(15).max(5000),
  }),
  z.object({ mode: z.literal('city') }),
])

const updateSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  locationVisibility: z.boolean().optional(),
  locationPrivacy: locationPrivacySchema.optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  skipGeocode: z.boolean().optional(),
})

async function requireAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error('Tenés que iniciar sesión para guardar tu ubicación.')

  return user.id
}

export async function updateUserLocationSettingsAction(
  input: z.input<typeof updateSchema>,
): Promise<UserLocationSettingsDto> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Datos de ubicación inválidos.')
  }

  const userId = await requireAuthenticatedUserId()
  const payload = parsed.data

  if (payload.latitude !== undefined && payload.latitude !== null && !isValidLatitude(payload.latitude)) {
    throw new Error('Latitud inválida.')
  }
  if (payload.longitude !== undefined && payload.longitude !== null && !isValidLongitude(payload.longitude)) {
    throw new Error('Longitud inválida.')
  }

  let city = payload.city
  let province = payload.province

  const coordsChanged =
    payload.latitude !== undefined &&
    payload.longitude !== undefined &&
    payload.latitude !== null &&
    payload.longitude !== null

  if (coordsChanged && !payload.skipGeocode) {
    const geocoded = await reverseGeocodeUserLocation({
      latitude: payload.latitude as number,
      longitude: payload.longitude as number,
    })
    city = geocoded.city
    province = geocoded.province
  }

  const locationPrivacy = payload.locationPrivacy

  return updateUserLocationSettings(userId, {
    latitude: payload.latitude,
    longitude: payload.longitude,
    locationVisibility: payload.locationVisibility,
    locationPrivacy,
    city,
    province,
  })
}
