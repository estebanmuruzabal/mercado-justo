'use server'

import { createClient } from '@/shared/database/supabase/server'
import { isTelegramConfigured } from '@/shared/telegram/telegram/config'
import { isValidUserConnectDeepLink } from '@/shared/telegram/telegram/user-link-payload'

import type { UserTelegramConnectionDto } from '../../domain/user-telegram-connection'
import {
  createUserTelegramConnectLink,
  findUserTelegramConnection,
} from '../../infrastructure/user-telegram.service'

async function requireAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error('Tenés que iniciar sesión.')

  return user.id
}

export type ConnectUserTelegramResult =
  | { success: true; deepLink: string; expiresAt: string }
  | { success: false; error: string }

/** Mint a one-time deep link token and return the Telegram URL for the user to open. */
export async function connectUserTelegramAction(): Promise<ConnectUserTelegramResult> {
  try {
    if (!isTelegramConfigured()) {
      return {
        success: false,
        error: 'La integración con Telegram no está configurada todavía.',
      }
    }

    const userId = await requireAuthenticatedUserId()
    const link = await createUserTelegramConnectLink(userId)

    if (!isValidUserConnectDeepLink(link.deepLink)) {
      return {
        success: false,
        error: 'No se pudo generar un enlace de Telegram válido. Intentá de nuevo.',
      }
    }

    return { success: true, deepLink: link.deepLink, expiresAt: link.expiresAt }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo iniciar la conexión con Telegram.',
    }
  }
}

/** Lightweight status read for frontend polling after opening the deep link. */
export async function getUserTelegramConnectionStatusAction(): Promise<UserTelegramConnectionDto> {
  const userId = await requireAuthenticatedUserId()
  return findUserTelegramConnection(userId)
}
