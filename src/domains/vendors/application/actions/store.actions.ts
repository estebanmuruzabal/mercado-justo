'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { PROFILE_PATH, VENDOR_DASHBOARD_PATH } from '@/shared/routing/routes'
import { createClient } from '@/shared/database/supabase/server'
import { createStore, getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'
import type { StoreActionResult, StoreMode } from '@/domains/vendors/domain/store'

const sellerModeSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre del negocio.'),
  address: z.string().trim().optional(),
  latitude: z.string().trim().optional(),
  longitude: z.string().trim().optional(),
  mode: z.enum(['online', 'physical']).default('online'),
  termsAccepted: z.literal('true'),
})

function parseOptionalNumber(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    throw new Error('Latitud y longitud deben ser números válidos.')
  }

  return parsed
}

async function getCurrentUserId() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error('No se pudo identificar al usuario autenticado.')
  }

  return data.user.id
}

export async function activateSellerMode(
  formData: FormData
): Promise<StoreActionResult> {
  try {
    const parsed = sellerModeSchema.safeParse({
      name: formData.get('name'),
      address: formData.get('address')?.toString(),
      latitude: formData.get('latitude')?.toString(),
      longitude: formData.get('longitude')?.toString(),
      mode: formData.get('mode')?.toString() ?? 'online',
      termsAccepted: formData.get('termsAccepted'),
    })

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Revisá los datos del store.',
      }
    }

    const userId = await getCurrentUserId()

    const store = await createStore(userId, {
      name: parsed.data.name,
      address: parsed.data.address || null,
      latitude: parseOptionalNumber(parsed.data.latitude),
      longitude: parseOptionalNumber(parsed.data.longitude),
      mode: parsed.data.mode as StoreMode,
    })

    revalidatePath(PROFILE_PATH)
    revalidatePath(VENDOR_DASHBOARD_PATH)

    return {
      success: true,
      store,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo activar el modo vendedor.',
    }
  }
}

export async function getMyStore(): Promise<StoreActionResult> {
  try {
    const userId = await getCurrentUserId()
    const store = await getStoreByUserId(userId)

    return {
      success: true,
      store,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo obtener tu store.',
    }
  }
}

