import { createClient } from '@/shared/database/supabase/server'
import { createServiceClient } from '@/shared/database/supabase/service'
import { generateLinkToken, linkTokenExpiry } from '@/shared/telegram/telegram/link'
import { buildUserConnectDeepLink } from '@/shared/telegram/telegram/user-link'

import {
  logTelegramUserConnectTokenLookup,
  logTelegramUserConnectTokenStatus,
  logTelegramUserConnectUpdate,
} from '@/shared/telegram/telegram/user-connect-debug'

import type {
  ConnectUserTelegramByTokenResult,
  UserTelegramConnectionDto,
} from '../domain/user-telegram-connection'

export type UserTelegramConnectLink = {
  token: string
  deepLink: string
  expiresAt: string
}

type UserTelegramRow = {
  user_id: string
  chat_id: string | null
  telegram_user_id: string | null
  username: string | null
  connected_at: string | null
  link_token: string | null
  link_token_expires_at: string | null
}

function mapConnection(row: UserTelegramRow | null): UserTelegramConnectionDto {
  return {
    telegramConnected: Boolean(row?.chat_id),
    telegramUserId: row?.telegram_user_id ?? null,
    telegramChatId: row?.chat_id ?? null,
    telegramUsername: row?.username ?? null,
    telegramConnectedAt: row?.connected_at ?? null,
  }
}

export async function findUserTelegramConnection(
  userId: string,
): Promise<UserTelegramConnectionDto> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_telegram')
    .select('chat_id, telegram_user_id, username, connected_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return mapConnection((data as UserTelegramRow | null) ?? null)
}

/** Service-role read for webhook diagnostics after linking. */
export async function findUserTelegramConnectionWithService(
  userId: string,
): Promise<UserTelegramConnectionDto> {
  const service = createServiceClient()
  const { data, error } = await service
    .from('user_telegram')
    .select('chat_id, telegram_user_id, username, connected_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return mapConnection((data as UserTelegramRow | null) ?? null)
}

/**
 * Mint a one-time connect token (15 min TTL). Rejects when already linked.
 * Tokens are never reused: consumed on successful webhook link.
 */
export async function createUserTelegramConnectLink(
  userId: string,
): Promise<UserTelegramConnectLink> {
  const supabase = await createClient()

  const { data: existing, error: readError } = await supabase
    .from('user_telegram')
    .select('chat_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (readError) throw readError
  if (existing?.chat_id) {
    throw new Error('Tu cuenta de Telegram ya está vinculada.')
  }

  const token = generateLinkToken()
  const expiresAt = linkTokenExpiry()

  const { error } = await supabase.from('user_telegram').upsert(
    {
      user_id: userId,
      link_token: token,
      link_token_expires_at: expiresAt,
    } as never,
    { onConflict: 'user_id' },
  )

  if (error) throw error

  return {
    token,
    deepLink: buildUserConnectDeepLink(token),
    expiresAt,
  }
}

/**
 * Resolve `/start connect_<token>` from the webhook (service role).
 * Idempotent when the same Mercado Justo user repeats a valid link for the same chat.
 */
export async function connectUserByToken(
  token: string,
  chatId: string | number,
  telegramUserId: string | number,
  username: string | null,
): Promise<ConnectUserTelegramByTokenResult> {
  const service = createServiceClient()
  const chatIdStr = String(chatId)
  const telegramUserIdStr = String(telegramUserId)
  const normalizedUsername = username?.trim() || null

  const { data: row, error } = await service
    .from('user_telegram')
    .select('*')
    .eq('link_token', token)
    .maybeSingle()

  logTelegramUserConnectTokenLookup({
    token,
    found: Boolean(row),
    userId: (row as UserTelegramRow | null)?.user_id ?? null,
    linkTokenExpiresAt: (row as UserTelegramRow | null)?.link_token_expires_at ?? null,
    existingChatId: (row as UserTelegramRow | null)?.chat_id ?? null,
    dbError: error?.message ?? null,
  })

  if (error) throw error
  if (!row) {
    logTelegramUserConnectTokenStatus({
      token,
      status: 'invalid',
      reason: 'No row found for link_token in user_telegram',
    })
    return { status: 'invalid_token' }
  }

  const typedRow = row as UserTelegramRow

  if (
    typedRow.link_token_expires_at &&
    new Date(typedRow.link_token_expires_at).getTime() < Date.now()
  ) {
    logTelegramUserConnectTokenStatus({
      token,
      status: 'expired',
      reason: `Token expired at ${typedRow.link_token_expires_at}`,
    })
    return { status: 'expired_token' }
  }

  logTelegramUserConnectTokenStatus({
    token,
    status: 'valid',
    reason: `Token matched user_id=${typedRow.user_id}`,
  })

  if (typedRow.chat_id && typedRow.chat_id === chatIdStr && typedRow.user_id) {
    const { error: idempotentUpdateError } = await service
      .from('user_telegram')
      .update({
        link_token: null,
        link_token_expires_at: null,
        telegram_user_id: telegramUserIdStr,
        username: normalizedUsername,
        connected_at: typedRow.connected_at ?? new Date().toISOString(),
      } as never)
      .eq('user_id', typedRow.user_id)

    logTelegramUserConnectUpdate({
      userId: typedRow.user_id,
      token,
      updateAttempted: true,
      updateSucceeded: !idempotentUpdateError,
      dbError: idempotentUpdateError?.message ?? null,
      chatId: chatIdStr,
      telegramUserId: telegramUserIdStr,
      username: normalizedUsername,
      connectedAt: typedRow.connected_at ?? new Date().toISOString(),
    })

    if (normalizedUsername) {
      await service
        .from('user')
        .update({ telegram_username: normalizedUsername } as never)
        .eq('id', typedRow.user_id)
    }

    return { status: 'already_connected', userId: typedRow.user_id }
  }

  const { data: chatOwner, error: chatOwnerError } = await service
    .from('user_telegram')
    .select('user_id')
    .eq('chat_id', chatIdStr)
    .maybeSingle()

  if (chatOwnerError) throw chatOwnerError
  if (chatOwner && chatOwner.user_id !== typedRow.user_id) {
    logTelegramUserConnectTokenStatus({
      token,
      status: 'chat_taken',
      reason: `chat_id ${chatIdStr} already linked to user_id=${chatOwner.user_id}`,
    })
    return { status: 'chat_taken' }
  }

  const { data: telegramUserOwner, error: telegramUserOwnerError } = await service
    .from('user_telegram')
    .select('user_id')
    .eq('telegram_user_id', telegramUserIdStr)
    .maybeSingle()

  if (telegramUserOwnerError) throw telegramUserOwnerError
  if (telegramUserOwner && telegramUserOwner.user_id !== typedRow.user_id) {
    logTelegramUserConnectTokenStatus({
      token,
      status: 'chat_taken',
      reason: `telegram_user_id ${telegramUserIdStr} already linked to user_id=${telegramUserOwner.user_id}`,
    })
    return { status: 'chat_taken' }
  }

  const connectedAt = new Date().toISOString()

  const { data: updated, error: updateError } = await service
    .from('user_telegram')
    .update({
      chat_id: chatIdStr,
      telegram_user_id: telegramUserIdStr,
      username: normalizedUsername,
      connected_at: connectedAt,
      link_token: null,
      link_token_expires_at: null,
    } as never)
    .eq('user_id', typedRow.user_id)
    .eq('link_token', token)
    .select('user_id, chat_id, telegram_user_id, username, connected_at')
    .maybeSingle()

  logTelegramUserConnectUpdate({
    userId: typedRow.user_id,
    token,
    updateAttempted: true,
    updateSucceeded: Boolean(updated) && !updateError,
    dbError: updateError?.message ?? null,
    chatId: (updated as UserTelegramRow | null)?.chat_id ?? chatIdStr,
    telegramUserId: (updated as UserTelegramRow | null)?.telegram_user_id ?? telegramUserIdStr,
    username: (updated as UserTelegramRow | null)?.username ?? normalizedUsername,
    connectedAt: (updated as UserTelegramRow | null)?.connected_at ?? connectedAt,
  })

  if (updateError) throw updateError
  if (!updated) {
    logTelegramUserConnectTokenStatus({
      token,
      status: 'invalid',
      reason: 'Update returned no rows (token may have been consumed concurrently)',
    })
    return { status: 'invalid_token' }
  }

  if (normalizedUsername) {
    await service
      .from('user')
      .update({ telegram_username: normalizedUsername } as never)
      .eq('id', typedRow.user_id)
  }

  return { status: 'connected', userId: typedRow.user_id }
}
