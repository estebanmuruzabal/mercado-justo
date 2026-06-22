import { createClient } from '@/shared/database/supabase/server'

import { formatLastSeenLabel } from '@/domains/users/domain/user-presence'

import { hasUnreadMessages } from '../domain/conversation'
import type { ConversationHeaderDto } from '../application/dto/conversation-header.dto'
import type { ConversationListItemDto } from '../application/dto/conversation.dto'
import type { MessageableUserDto } from '../application/dto/messageable-user.dto'

type ParticipantRow = {
  conversation_id: string
  last_read_at: string | null
}

type ConversationRow = {
  id: string
  last_message_at: string | null
  last_message_preview: string | null
}

type OtherParticipantRow = {
  conversation_id: string
  user_id: string
}

type UserProfileRow = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  last_seen_at: string | null
}

type LastMessageRow = {
  conversation_id: string
  sender_id: string
  created_at: string
}

function displayNameFromUser(user: UserProfileRow): string {
  return user.full_name?.trim() || user.username?.trim() || 'Usuario'
}

export async function listConversationsForUser(userId: string): Promise<ConversationListItemDto[]> {
  const supabase = await createClient()

  const { data: participantRows, error } = await supabase
    .from('conversation_participant')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)

  if (error) throw error

  const rows = (participantRows ?? []) as ParticipantRow[]
  if (rows.length === 0) return []

  const conversationIds = rows.map((row) => row.conversation_id)

  const [
    { data: conversations, error: conversationsError },
    { data: otherParticipants, error: otherError },
    { data: lastMessages, error: lastError },
  ] = await Promise.all([
    supabase
      .from('conversation')
      .select('id, last_message_at, last_message_preview')
      .in('id', conversationIds),
    supabase
      .from('conversation_participant')
      .select('conversation_id, user_id')
      .in('conversation_id', conversationIds)
      .neq('user_id', userId),
    supabase
      .from('message')
      .select('conversation_id, sender_id, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false }),
  ])

  if (conversationsError) throw conversationsError
  if (otherError) throw otherError
  if (lastError) throw lastError

  const conversationById = new Map<string, ConversationRow>()
  for (const conversation of (conversations ?? []) as ConversationRow[]) {
    conversationById.set(conversation.id, conversation)
  }

  const otherByConversation = new Map<string, string>()
  for (const row of (otherParticipants ?? []) as OtherParticipantRow[]) {
    otherByConversation.set(row.conversation_id, row.user_id)
  }

  const lastMessageByConversation = new Map<string, LastMessageRow>()
  for (const row of (lastMessages ?? []) as LastMessageRow[]) {
    if (!lastMessageByConversation.has(row.conversation_id)) {
      lastMessageByConversation.set(row.conversation_id, row)
    }
  }

  const otherUserIds = [...new Set(otherByConversation.values())]
  const { data: users, error: usersError } = await supabase
    .from('user')
    .select('id, full_name, username, avatar_url')
    .in('id', otherUserIds)

  if (usersError) throw usersError

  const userById = new Map<string, UserProfileRow>()
  for (const user of (users ?? []) as UserProfileRow[]) {
    userById.set(user.id, user)
  }

  const items = rows
    .map((row) => {
      const conversation = conversationById.get(row.conversation_id)
      if (!conversation) return null

      const otherUserId = otherByConversation.get(row.conversation_id)
      if (!otherUserId) return null

      const otherUser = userById.get(otherUserId)
      if (!otherUser) return null

      const lastMessage = lastMessageByConversation.get(row.conversation_id)

      return {
        id: conversation.id,
        otherParticipant: {
          id: otherUser.id,
          displayName: displayNameFromUser(otherUser),
          avatarUrl: otherUser.avatar_url,
        },
        lastMessagePreview: conversation.last_message_preview,
        lastMessageAt: conversation.last_message_at,
        unread: hasUnreadMessages({
          lastReadAt: row.last_read_at,
          lastMessageAt: conversation.last_message_at,
          lastMessageSenderId: lastMessage?.sender_id ?? null,
          currentUserId: userId,
        }),
      } satisfies ConversationListItemDto
    })
    .filter((item): item is ConversationListItemDto => item != null)

  items.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  return items
}

export async function searchMessageableUsers(
  query: string,
  limit = 20,
): Promise<MessageableUserDto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.schema('public').rpc('search_messageable_users', {
    p_query: query,
    p_limit: limit,
  })

  if (error) throw error

  return ((data ?? []) as Array<{
    id: string
    full_name: string | null
    avatar_url: string | null
    location_label: string | null
  }>).map((row) => ({
    id: row.id,
    displayName: row.full_name?.trim() || 'Usuario',
    avatarUrl: row.avatar_url,
    locationLabel: row.location_label,
  }))
}

export async function getOrCreateDirectConversation(otherUserId: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.schema('public').rpc('get_or_create_direct_conversation', {
    p_other_user_id: otherUserId,
  })

  if (error) throw error
  if (!data) throw new Error('No se pudo abrir la conversación.')

  return data as string
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('conversation_participant')
    .update({ last_read_at: new Date().toISOString() } as never)
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getOtherParticipant(
  conversationId: string,
  currentUserId: string,
): Promise<ConversationHeaderDto | null> {
  const supabase = await createClient()

  const { data: participants, error: participantsError } = await supabase
    .from('conversation_participant')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .neq('user_id', currentUserId)
    .limit(1)

  if (participantsError) throw participantsError

  const participantRows = (participants ?? []) as Array<{ user_id: string }>
  const otherUserId = participantRows[0]?.user_id
  if (!otherUserId) return null

  const { data: user, error: userError } = await supabase
    .from('user')
    .select('id, full_name, username, avatar_url, last_seen_at')
    .eq('id', otherUserId)
    .maybeSingle()

  if (userError) throw userError
  if (!user) return null

  const profile = user as UserProfileRow

  return {
    id: profile.id,
    displayName: displayNameFromUser(profile),
    avatarUrl: profile.avatar_url,
    lastSeenAt: profile.last_seen_at,
    presenceLabel: formatLastSeenLabel(profile.last_seen_at),
  }
}

export async function isConversationParticipant(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversation_participant')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}
