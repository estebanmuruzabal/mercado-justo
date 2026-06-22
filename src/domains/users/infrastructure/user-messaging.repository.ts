import { createClient } from '@/shared/database/supabase/server'

import type {
  UpdateUserMessagingSettingsInput,
  UserMessagingSettingsDto,
} from '../application/dto/user-messaging.dto'

type UserMessagingRow = {
  allow_direct_messages: boolean
}

const SELECT = 'allow_direct_messages'

function mapRow(row: UserMessagingRow): UserMessagingSettingsDto {
  return {
    allowDirectMessages: row.allow_direct_messages,
  }
}

export async function findUserMessagingSettings(
  userId: string,
): Promise<UserMessagingSettingsDto | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user')
    .select(SELECT)
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapRow(data as UserMessagingRow)
}

export async function updateUserMessagingSettings(
  userId: string,
  input: UpdateUserMessagingSettingsInput,
): Promise<UserMessagingSettingsDto> {
  const supabase = await createClient()

  const patch: Record<string, unknown> = {}
  if (input.allowDirectMessages !== undefined) {
    patch.allow_direct_messages = input.allowDirectMessages
  }

  const { data, error } = await supabase
    .from('user')
    .update(patch as never)
    .eq('id', userId)
    .select(SELECT)
    .single()

  if (error) throw error

  return mapRow(data as UserMessagingRow)
}
