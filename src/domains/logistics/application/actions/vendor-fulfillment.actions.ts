'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/shared/database/supabase/server'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'
import { VENDOR_FULFILLMENT_PATH } from '@/shared/routing/routes'
import { FULFILLMENT_METHOD_CODES } from '@/domains/logistics/domain/types'
import { ISO_WEEKDAYS } from '@/domains/logistics/domain/window-schedule'
import {
  normalizeVendorFulfillmentPreferences,
  validateVendorFulfillmentSettings,
} from '@/domains/logistics/domain/policies/vendor-fulfillment-policy'
import type { SaveVendorFulfillmentSettingsResultDto } from '@/domains/logistics/application/dto/vendor-fulfillment.dto'
import { listActiveFulfillmentMethods } from '@/domains/logistics/infrastructure/fulfillment-catalog.repository'
import { upsertVendorFulfillmentSettings } from '@/domains/logistics/infrastructure/vendor-fulfillment.repository'
import {
  activeWindowIds,
  countActiveWindows,
  createVendorDeliveryWindow,
  createVendorPickupWindow,
  listVendorDeliveryWindows,
  listVendorPickupWindows,
  setVendorDeliveryWindowActive,
  setVendorPickupWindowActive,
  updateVendorDeliveryWindow,
  updateVendorPickupWindow,
} from '@/domains/logistics/infrastructure/vendor-time-windows.repository'

const preferencesSchema = z.object({
  autoUseStoreAddressForPickup: z.boolean().optional().default(true),
  requireBuyerConfirmation: z.boolean().optional().default(false),
  allowSameDayPickup: z.boolean().optional().default(false),
  allowSameDayDelivery: z.boolean().optional().default(false),
  minimumPreparationMinutes: z.preprocess(
    (value) => (value === '' || value == null ? null : Number(value)),
    z
      .number({ invalid_type_error: 'Tiempo de preparación inválido.' })
      .int('Usá minutos enteros.')
      .min(0, 'El tiempo mínimo no puede ser negativo.')
      .nullable(),
  ),
  notes: z
    .string()
    .trim()
    .max(500, 'Las notas son demasiado largas (máx. 500 caracteres).')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
})

const saveVendorFulfillmentSettingsSchema = z.object({
  enabledMethodCodes: z.array(z.enum(FULFILLMENT_METHOD_CODES)).default([]),
  deliveryRadiusKm: z.preprocess(
    (value) => (value === '' || value == null ? null : Number(value)),
    z
      .number({ invalid_type_error: 'Radio de delivery inválido.' })
      .min(0, 'El radio de delivery no puede ser negativo.')
      .nullable(),
  ),
  pickupAddress: z
    .string()
    .trim()
    .max(300, 'La dirección de pickup es demasiado larga.')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  defaultMethodCode: z
    .enum(FULFILLMENT_METHOD_CODES)
    .nullish()
    .transform((value) => value ?? null),
  preferences: preferencesSchema.optional().default({ autoUseStoreAddressForPickup: true }),
})

export async function saveVendorFulfillmentSettingsAction(
  input: z.input<typeof saveVendorFulfillmentSettingsSchema>,
): Promise<SaveVendorFulfillmentSettingsResultDto> {
  const parsed = saveVendorFulfillmentSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No hay sesión activa.' }

  const store = await getStoreByUserId(user.id)
  if (!store) return { success: false, error: 'No encontramos tu tienda.' }

  const [methods, pickupWindows, deliveryWindows] = await Promise.all([
    listActiveFulfillmentMethods(supabase),
    listVendorPickupWindows(supabase, user.id),
    listVendorDeliveryWindows(supabase, user.id),
  ])

  const preferences = normalizeVendorFulfillmentPreferences(parsed.data.preferences)

  const validationError = validateVendorFulfillmentSettings(
    {
      enabledMethodCodes: parsed.data.enabledMethodCodes,
      deliveryRadiusKm: parsed.data.deliveryRadiusKm,
      defaultMethodCode: parsed.data.defaultMethodCode,
      pickupAddress: parsed.data.pickupAddress,
      preferences,
    },
    {
      availableMethodCodes: methods.map((method) => method.code),
      activePickupWindowCount: countActiveWindows(pickupWindows),
      activeDeliveryWindowCount: countActiveWindows(deliveryWindows),
      storeAddress: store.address ?? null,
    },
  )

  if (validationError) {
    return { success: false, error: validationError }
  }

  try {
    await upsertVendorFulfillmentSettings(supabase, {
      vendorId: user.id,
      enabledMethodCodes: parsed.data.enabledMethodCodes,
      enabledPickupWindowIds: activeWindowIds(pickupWindows),
      enabledDeliveryWindowIds: activeWindowIds(deliveryWindows),
      deliveryRadiusKm: parsed.data.deliveryRadiusKm,
      pickupAddress: parsed.data.pickupAddress,
      defaultMethodCode: parsed.data.defaultMethodCode,
      preferences,
    })

    revalidatePath(VENDOR_FULFILLMENT_PATH)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo guardar la configuración.',
    }
  }
}

const vendorWindowSchema = z.object({
  dayOfWeek: z.coerce.number().pipe(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)])),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora de inicio inválida.'),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora de fin inválida.'),
})

function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value
}

async function requireVendorSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null as null, error: 'No hay sesión activa.' as const }
  const store = await getStoreByUserId(user.id)
  if (!store) return { supabase, user: null as null, error: 'No encontramos tu tienda.' as const }
  return { supabase, user, error: null as null }
}

export async function createVendorPickupWindowAction(input: z.input<typeof vendorWindowSchema>) {
  const parsed = vendorWindowSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const session = await requireVendorSession()
  if (session.error || !session.user) return { success: false as const, error: session.error }

  try {
    const window = await createVendorPickupWindow(session.supabase, {
      vendorId: session.user.id,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: normalizeTime(parsed.data.startTime),
      endTime: normalizeTime(parsed.data.endTime),
    })
    revalidatePath(VENDOR_FULFILLMENT_PATH)
    return { success: true as const, windowId: window.id }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'No se pudo crear la ventana.',
    }
  }
}

export async function updateVendorPickupWindowAction(
  windowId: string,
  input: z.input<typeof vendorWindowSchema>,
) {
  const parsed = vendorWindowSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const session = await requireVendorSession()
  if (session.error || !session.user) return { success: false as const, error: session.error }

  try {
    const window = await updateVendorPickupWindow(session.supabase, session.user.id, windowId, {
      vendorId: session.user.id,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: normalizeTime(parsed.data.startTime),
      endTime: normalizeTime(parsed.data.endTime),
    })
    revalidatePath(VENDOR_FULFILLMENT_PATH)
    return { success: true as const, windowId: window.id }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'No se pudo actualizar la ventana.',
    }
  }
}

export async function setVendorPickupWindowActiveAction(windowId: string, isActive: boolean) {
  const session = await requireVendorSession()
  if (session.error || !session.user) return { success: false as const, error: session.error }

  try {
    await setVendorPickupWindowActive(session.supabase, session.user.id, windowId, isActive)
    revalidatePath(VENDOR_FULFILLMENT_PATH)
    return { success: true as const, windowId }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'No se pudo actualizar la ventana.',
    }
  }
}

export async function createVendorDeliveryWindowAction(input: z.input<typeof vendorWindowSchema>) {
  const parsed = vendorWindowSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const session = await requireVendorSession()
  if (session.error || !session.user) return { success: false as const, error: session.error }

  try {
    const window = await createVendorDeliveryWindow(session.supabase, {
      vendorId: session.user.id,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: normalizeTime(parsed.data.startTime),
      endTime: normalizeTime(parsed.data.endTime),
    })
    revalidatePath(VENDOR_FULFILLMENT_PATH)
    return { success: true as const, windowId: window.id }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'No se pudo crear la ventana.',
    }
  }
}

export async function updateVendorDeliveryWindowAction(
  windowId: string,
  input: z.input<typeof vendorWindowSchema>,
) {
  const parsed = vendorWindowSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const session = await requireVendorSession()
  if (session.error || !session.user) return { success: false as const, error: session.error }

  try {
    const window = await updateVendorDeliveryWindow(session.supabase, session.user.id, windowId, {
      vendorId: session.user.id,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: normalizeTime(parsed.data.startTime),
      endTime: normalizeTime(parsed.data.endTime),
    })
    revalidatePath(VENDOR_FULFILLMENT_PATH)
    return { success: true as const, windowId: window.id }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'No se pudo actualizar la ventana.',
    }
  }
}

export async function setVendorDeliveryWindowActiveAction(windowId: string, isActive: boolean) {
  const session = await requireVendorSession()
  if (session.error || !session.user) return { success: false as const, error: session.error }

  try {
    await setVendorDeliveryWindowActive(session.supabase, session.user.id, windowId, isActive)
    revalidatePath(VENDOR_FULFILLMENT_PATH)
    return { success: true as const, windowId }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'No se pudo actualizar la ventana.',
    }
  }
}

export const VENDOR_WINDOW_DAY_OPTIONS = ISO_WEEKDAYS.map((day) => ({ value: day }))
