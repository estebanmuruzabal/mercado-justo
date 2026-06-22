'use server'

import { z } from 'zod'

import { createClient } from '@/shared/database/supabase/server'

import type { UserMessagingSettingsDto } from '../dto/user-messaging.dto'
import { updateUserMessagingSettings } from '../../infrastructure/user-messaging.repository'

const updateSchema = z.object({
  allowDirectMessages: z.boolean(),
})

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

export async function updateUserMessagingSettingsAction(
  input: z.input<typeof updateSchema>,
): Promise<UserMessagingSettingsDto> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Configuración inválida.')
  }

  const userId = await requireAuthenticatedUserId()
  return updateUserMessagingSettings(userId, parsed.data)
}
