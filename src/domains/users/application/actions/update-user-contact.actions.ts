'use server'

import { z } from 'zod'

import { createClient } from '@/shared/database/supabase/server'

import {
  validatePhoneNumber,
  validateTelegramUsername,
  validateWhatsappNumber,
} from '../../domain/policies/user-contact-policy'
import { updateUserContactSettings } from '../../infrastructure/user-contact.repository'
import type { UserContactSettingsDto } from '../dto/user-contact.dto'

const nullableString = z.string().nullable().optional()

const updateSchema = z.object({
  phoneNumber: nullableString,
  whatsappNumber: nullableString,
  telegramUsername: nullableString,
  allowPhoneCalls: z.boolean().optional(),
  allowWhatsappMessages: z.boolean().optional(),
  allowTelegramMessages: z.boolean().optional(),
  allowEmailContact: z.boolean().optional(),
  preferredContactHours: nullableString,
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

export async function updateUserContactSettingsAction(
  input: z.input<typeof updateSchema>,
): Promise<UserContactSettingsDto> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Configuración inválida.')
  }

  const phoneError = validatePhoneNumber(parsed.data.phoneNumber)
  if (phoneError) throw new Error(phoneError)

  const whatsappError = validateWhatsappNumber(parsed.data.whatsappNumber)
  if (whatsappError) throw new Error(whatsappError)

  const telegramError = validateTelegramUsername(parsed.data.telegramUsername)
  if (telegramError) throw new Error(telegramError)

  const userId = await requireAuthenticatedUserId()
  return updateUserContactSettings(userId, parsed.data)
}
