'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/shared/database/supabase/server'
import { isTelegramConfigured } from '@/shared/telegram/telegram/config'
import { telegramPreferencesSchema, type TelegramPreferencesInput } from '@/shared/telegram/telegram/preferences-schema'
import { PROFILE_PATH, VENDOR_NOTIFICATIONS_PATH } from '@/shared/routing/routes'
import { getUserTelegramSettings } from '@/domains/dittobots/application/queries/telegram.queries'
import {
  createConnectLink,
  disconnectTelegram,
  sendVendorTelegramEvent,
  updateTelegramSettings,
} from '@/domains/dittobots/infrastructure/telegram.service'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'
import type { UserTelegramSettings } from '@/domains/dittobots/domain/vendor-telegram-settings'

type ActionError = { success: false; error: string }
type ActionOk<T = Record<never, never>> = { success: true } & T

/** Resolve any authenticated Mercado Justo user (profile Telegram linking). */
async function requireAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No hay sesión activa.' as const, supabase: null, userId: null }
  }

  return { error: null, supabase, userId: user.id }
}

/** Resolve an authenticated vendor (store owner) for preference edits. */
async function requireVendorContext() {
  const ctx = await requireAuthUser()
  if (ctx.error) return { error: ctx.error, supabase: null, storeId: null, userId: null }

  const store = await getStoreByUserId(ctx.userId)
  if (!store) {
    return { error: 'Necesitás una tienda activa.' as const, supabase: null, storeId: null, userId: null }
  }

  return { error: null, supabase: ctx.supabase, storeId: ctx.userId, userId: ctx.userId }
}

function revalidateTelegramPaths() {
  revalidatePath(PROFILE_PATH)
  revalidatePath(VENDOR_NOTIFICATIONS_PATH)
}

export type GetTelegramSettingsResult =
  | ActionOk<{ settings: UserTelegramSettings; configured: boolean }>
  | ActionError

/** Read the current user's Telegram settings (used for status + polling). */
export async function getTelegramSettingsAction(): Promise<GetTelegramSettingsResult> {
  try {
    const ctx = await requireAuthUser()
    if (ctx.error) return { success: false, error: ctx.error }

    const settings = await getUserTelegramSettings(ctx.supabase, ctx.userId)
    return { success: true, settings, configured: isTelegramConfigured() }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo cargar.' }
  }
}

export type ConnectTelegramResult = ActionOk<{ deepLink: string; expiresAt: string }> | ActionError

/** Generate a one-time connect deep link for the authenticated user. */
export async function connectTelegramAction(): Promise<ConnectTelegramResult> {
  try {
    if (!isTelegramConfigured()) {
      return { success: false, error: 'La integración con Telegram no está configurada.' }
    }

    const ctx = await requireAuthUser()
    if (ctx.error) return { success: false, error: ctx.error }

    const link = await createConnectLink(ctx.supabase, ctx.userId)
    revalidateTelegramPaths()
    return { success: true, deepLink: link.deepLink, expiresAt: link.expiresAt }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo generar el enlace.' }
  }
}

export type UpdateTelegramPreferencesResult =
  | ActionOk<{ settings: UserTelegramSettings }>
  | ActionError

/** Persist the master switch + per-event preferences (vendors only). */
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

    const settings = await updateTelegramSettings(ctx.supabase, ctx.userId, parsed.data)
    revalidateTelegramPaths()
    return { success: true, settings }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo guardar.' }
  }
}

export type SendTelegramTestResult = ActionOk | ActionError

/** Send a test notification to the connected chat (vendors / connected users). */
export async function sendTelegramTestAction(): Promise<SendTelegramTestResult> {
  try {
    const ctx = await requireAuthUser()
    if (ctx.error) return { success: false, error: ctx.error }

    const settings = await getUserTelegramSettings(ctx.supabase, ctx.userId)
    if (!settings.connected) {
      return { success: false, error: 'Primero conectá tu cuenta de Telegram.' }
    }
    if (!settings.enabled) {
      return { success: false, error: 'Activá las notificaciones de Telegram para probar.' }
    }

    const result = await sendVendorTelegramEvent(ctx.userId, { type: 'test', payload: {} })

    if (!result.delivered) {
      return { success: false, error: 'No se pudo enviar el mensaje de prueba. Intentá de nuevo.' }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo enviar la prueba.' }
  }
}

export type DisconnectTelegramResult = ActionOk | ActionError

/** Unlink the user's Telegram account. */
export async function disconnectTelegramAction(): Promise<DisconnectTelegramResult> {
  try {
    const ctx = await requireAuthUser()
    if (ctx.error) return { success: false, error: ctx.error }

    await disconnectTelegram(ctx.supabase, ctx.userId)
    revalidateTelegramPaths()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo desconectar.' }
  }
}
