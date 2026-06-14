'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/shared/database/supabase/server'
import { PROFILE_DITTOBOTS_PATH } from '@/shared/routing/routes'
import { deviceLocationFromUser } from '../../domain/device-location.policy'
import {
  getUnitByIdForOwner,
  loadUserLocation,
  updateDeviceSettings,
} from '../../infrastructure/ditto-bot-inventory.repository'

export type DeviceSettingsActionResult =
  | { success: true }
  | { success: false; error: string }

const settingsSchema = z.object({
  unitId: z.string().uuid(),
  locationLat: z.number().min(-90).max(90).nullable().optional(),
  locationLng: z.number().min(-180).max(180).nullable().optional(),
  locationRegion: z.string().trim().max(120).nullable().optional(),
  inheritsUserLocation: z.boolean().optional(),
  isPublicOnMap: z.boolean().optional(),
  friendlyName: z.string().trim().max(80).nullable().optional(),
})

export async function updateDittoBotDeviceSettingsAction(
  input: z.input<typeof settingsSchema>,
): Promise<DeviceSettingsActionResult> {
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Debés iniciar sesión.' }
  }

  try {
    const unit = await getUnitByIdForOwner(parsed.data.unitId, user.id)
    if (!unit || unit.status !== 'activated') {
      return { success: false, error: 'Dispositivo no encontrado.' }
    }

    const patch: Parameters<typeof updateDeviceSettings>[2] = {}

    if (parsed.data.inheritsUserLocation === true) {
      const userLocation = await loadUserLocation(user.id)
      const location = deviceLocationFromUser(userLocation ?? { lat: null, lng: null, region: null })
      patch.inheritsUserLocation = true
      patch.locationLat = location.lat
      patch.locationLng = location.lng
      patch.locationRegion = location.region
    } else {
      if (parsed.data.inheritsUserLocation !== undefined) {
        patch.inheritsUserLocation = parsed.data.inheritsUserLocation
      }
      if (parsed.data.locationLat !== undefined) patch.locationLat = parsed.data.locationLat
      if (parsed.data.locationLng !== undefined) patch.locationLng = parsed.data.locationLng
      if (parsed.data.locationRegion !== undefined) patch.locationRegion = parsed.data.locationRegion
    }

    if (parsed.data.isPublicOnMap !== undefined) patch.isPublicOnMap = parsed.data.isPublicOnMap
    if (parsed.data.friendlyName !== undefined) patch.friendlyName = parsed.data.friendlyName

    await updateDeviceSettings(parsed.data.unitId, user.id, patch)

    revalidatePath(PROFILE_DITTOBOTS_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar la configuración.',
    }
  }
}
