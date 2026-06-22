import { createClient } from '@/shared/database/supabase/server'

import type { MessageDto } from '../application/dto/message.dto'
import { normalizeMessageBody } from '../domain/message'

export async function listMessagesForConversation(
  conversationId: string,
  currentUserId: string,
): Promise<MessageDto[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('message')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return ((data ?? []) as Array<{
    id: string
    conversation_id: string
    sender_id: string
    body: string
    created_at: string
  }>).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    isOwn: row.sender_id === currentUserId,
  }))
}

export async function insertMessage(input: {
  conversationId: string
  senderId: string
  body: string
}): Promise<MessageDto> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('message')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      body: normalizeMessageBody(input.body),
    } as never)
    .select('id, conversation_id, sender_id, body, created_at')
    .single()

  if (error) throw error

  const row = data as {
    id: string
    conversation_id: string
    sender_id: string
    body: string
    created_at: string
  }

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    isOwn: true,
  }
}
