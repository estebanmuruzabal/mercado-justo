'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { isTelegramConfigured } from '@/lib/telegram/config'
import { telegramPreferencesSchema, type TelegramPreferencesInput } from '@/lib/telegram/preferences-schema'
import { VENDOR_NOTIFICATIONS_PATH } from '@/lib/routes'
import { getVendorTelegramSettings } from '@/server/queries/telegram.queries'
import {
  createConnectLink,
  disconnectTelegram,
  sendVendorTelegramEvent,
  updateTelegramSettings,
} from '@/server/services/telegram.service'
import { getStoreByUserId } from '@/server/services/store.service'
import type { VendorTelegramSettings } from '@/types/telegram'

type ActionError = { success: false; error: string }
type ActionOk<T = Record<never, never>> = { success: true } & T

/** Resolve the authenticated vendor (store owner). store.id === auth user id. */
async function requireVendorContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No hay sesión activa.' as const, supabase: null, storeId: null }
  }

  const store = await getStoreByUserId(user.id)
  if (!store) {
    return { error: 'Necesitás una tienda activa.' as const, supabase: null, storeId: null }
  }

  return { error: null, supabase, storeId: user.id }
}

export type GetTelegramSettingsResult =
  | ActionOk<{ settings: VendorTelegramSettings; configured: boolean }>
  | ActionError

/** Read the current vendor's Telegram settings (used for status + polling). */
export async function getTelegramSettingsAction(): Promise<GetTelegramSettingsResult> {
  try {
    const ctx = await requireVendorContext()
    if (ctx.error) return { success: false, error: ctx.error }

    const settings = await getVendorTelegramSettings(ctx.supabase, ctx.storeId)
    return { success: true, settings, configured: isTelegramConfigured() }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo cargar.' }
  }
}

export type ConnectTelegramResult = ActionOk<{ deepLink: string; expiresAt: string }> | ActionError

/** Generate a one-time connect deep link for the vendor to open in Telegram. */
export async function connectTelegramAction(): Promise<ConnectTelegramResult> {
  try {
    if (!isTelegramConfigured()) {
      return { success: false, error: 'La integración con Telegram no está configurada.' }
    }

    const ctx = await requireVendorContext()
    if (ctx.error) return { success: false, error: ctx.error }

    const link = await createConnectLink(ctx.supabase, ctx.storeId)
    revalidatePath(VENDOR_NOTIFICATIONS_PATH)
    return { success: true, deepLink: link.deepLink, expiresAt: link.expiresAt }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo generar el enlace.' }
  }
}

export type UpdateTelegramPreferencesResult =
  | ActionOk<{ settings: VendorTelegramSettings }>
  | ActionError

/** Persist the master switch + per-event preferences. */
export async function updateTelegramPreferencesAction(
  input: TelegramPreferencesInput,
): Promise<UpdateTelegramPreferencesResult> {
  try {
    const parsed = telegramPreferencesSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
    }

    const ctx = await requireVendorContext()
    if (ctx.error) return { success: false, error: ctx.error }

    const settings = await updateTelegramSettings(ctx.supabase, ctx.storeId, parsed.data)
    revalidatePath(VENDOR_NOTIFICATIONS_PATH)
    return { success: true, settings }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo guardar.' }
  }
}

export type SendTelegramTestResult = ActionOk | ActionError

/** Send a test notification to the connected chat. */
export async function sendTelegramTestAction(): Promise<SendTelegramTestResult> {
  try {
    const ctx = await requireVendorContext()
    if (ctx.error) return { success: false, error: ctx.error }

    const settings = await getVendorTelegramSettings(ctx.supabase, ctx.storeId)
    if (!settings.connected) {
      return { success: false, error: 'Primero conectá tu cuenta de Telegram.' }
    }
    if (!settings.enabled) {
      return { success: false, error: 'Activá las notificaciones de Telegram para probar.' }
    }

    const result = await sendVendorTelegramEvent(ctx.storeId, { type: 'test', payload: {} })

    if (!result.delivered) {
      return { success: false, error: 'No se pudo enviar el mensaje de prueba. Intentá de nuevo.' }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo enviar la prueba.' }
  }
}

export type DisconnectTelegramResult = ActionOk | ActionError

/** Unlink the vendor's Telegram account. */
export async function disconnectTelegramAction(): Promise<DisconnectTelegramResult> {
  try {
    const ctx = await requireVendorContext()
    if (ctx.error) return { success: false, error: ctx.error }

    await disconnectTelegram(ctx.supabase, ctx.storeId)
    revalidatePath(VENDOR_NOTIFICATIONS_PATH)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo desconectar.' }
  }
}
