import { createClient } from '@/shared/database/supabase/server'

import type {
  UpdateUserContactSettingsInput,
  UserContactProfileDto,
  UserContactSettingsDto,
} from '../application/dto/user-contact.dto'
import {
  normalizePhoneNumber,
  normalizeTelegramUsername,
  normalizeWhatsappContact,
} from '../domain/policies/user-contact-policy'

type UserContactRow = {
  phone_number: string | null
  whatsapp_number: string | null
  telegram_username: string | null
  allow_phone_calls: boolean
  allow_whatsapp_messages: boolean
  allow_telegram_messages: boolean
  allow_email_contact: boolean
  preferred_contact_hours: string | null
}

type UserTelegramJoinRow = {
  chat_id: string | null
  telegram_user_id: string | null
  username: string | null
  connected_at: string | null
}

const USER_SELECT =
  'phone_number, whatsapp_number, telegram_username, allow_phone_calls, allow_whatsapp_messages, allow_telegram_messages, allow_email_contact, preferred_contact_hours'

function mapSettings(
  row: UserContactRow,
  telegram: UserTelegramJoinRow | null,
): UserContactSettingsDto {
  return {
    phoneNumber: row.phone_number,
    whatsappNumber: row.whatsapp_number,
    telegramUsername: row.telegram_username ?? telegram?.username ?? null,
    telegramConnected: Boolean(telegram?.chat_id),
    telegramConnectedAt: telegram?.connected_at ?? null,
    telegramUserId: telegram?.telegram_user_id ?? null,
    telegramChatId: telegram?.chat_id ?? null,
    allowPhoneCalls: row.allow_phone_calls,
    allowWhatsappMessages: row.allow_whatsapp_messages,
    allowTelegramMessages: row.allow_telegram_messages,
    allowEmailContact: row.allow_email_contact,
    preferredContactHours: row.preferred_contact_hours,
  }
}

export async function findUserContactSettings(
  userId: string,
): Promise<UserContactSettingsDto | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user')
    .select(`${USER_SELECT}, user_telegram (chat_id, telegram_user_id, username, connected_at)`)
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as UserContactRow & {
    user_telegram: UserTelegramJoinRow | UserTelegramJoinRow[] | null
  }
  const telegram = Array.isArray(row.user_telegram)
    ? (row.user_telegram[0] ?? null)
    : row.user_telegram

  return mapSettings(row, telegram)
}

export async function findUserContactProfile(
  userId: string,
): Promise<UserContactProfileDto | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_contact_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as {
    user_id: string
    email: string | null
    phone_number: string | null
    whatsapp_number: string | null
    telegram_username: string | null
    telegram_user_id: string | null
    telegram_chat_id: string | null
    telegram_connected: boolean
    telegram_connected_at: string | null
    allow_phone_calls: boolean
    allow_whatsapp_messages: boolean
    allow_telegram_messages: boolean
    allow_email_contact: boolean
    preferred_contact_hours: string | null
  }

  return {
    userId: row.user_id,
    email: row.email,
    phoneNumber: row.phone_number,
    whatsappNumber: row.whatsapp_number,
    telegramUsername: row.telegram_username,
    telegramConnected: row.telegram_connected,
    telegramConnectedAt: row.telegram_connected_at,
    telegramUserId: row.telegram_user_id,
    telegramChatId: row.telegram_chat_id,
    allowPhoneCalls: row.allow_phone_calls,
    allowWhatsappMessages: row.allow_whatsapp_messages,
    allowTelegramMessages: row.allow_telegram_messages,
    allowEmailContact: row.allow_email_contact,
    preferredContactHours: row.preferred_contact_hours,
  }
}

export async function updateUserContactSettings(
  userId: string,
  input: UpdateUserContactSettingsInput,
): Promise<UserContactSettingsDto> {
  const supabase = await createClient()

  const patch: Record<string, unknown> = {}

  if (input.phoneNumber !== undefined) {
    patch.phone_number = normalizePhoneNumber(input.phoneNumber)
  }
  if (input.whatsappNumber !== undefined) {
    patch.whatsapp_number = normalizeWhatsappContact(input.whatsappNumber)
  }
  if (input.telegramUsername !== undefined) {
    patch.telegram_username = normalizeTelegramUsername(input.telegramUsername)
  }
  if (input.allowPhoneCalls !== undefined) patch.allow_phone_calls = input.allowPhoneCalls
  if (input.allowWhatsappMessages !== undefined) {
    patch.allow_whatsapp_messages = input.allowWhatsappMessages
  }
  if (input.allowTelegramMessages !== undefined) {
    patch.allow_telegram_messages = input.allowTelegramMessages
  }
  if (input.allowEmailContact !== undefined) patch.allow_email_contact = input.allowEmailContact
  if (input.preferredContactHours !== undefined) {
    patch.preferred_contact_hours = input.preferredContactHours?.trim() || null
  }

  const { data, error } = await supabase
    .from('user')
    .update(patch as never)
    .eq('id', userId)
    .select(`${USER_SELECT}, user_telegram (chat_id, telegram_user_id, username, connected_at)`)
    .single()

  if (error) throw error

  const row = data as UserContactRow & {
    user_telegram: UserTelegramJoinRow | UserTelegramJoinRow[] | null
  }
  const telegram = Array.isArray(row.user_telegram)
    ? (row.user_telegram[0] ?? null)
    : row.user_telegram

  return mapSettings(row, telegram)
}
