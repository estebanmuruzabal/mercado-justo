'use server'

import { z } from 'zod'

import { createClient } from '@/shared/database/supabase/server'

import type { ConversationListItemDto } from '../dto/conversation.dto'
import type { MessageDto } from '../dto/message.dto'
import type { MessageableUserDto } from '../dto/messageable-user.dto'
import { isValidMessageBody } from '../../domain/message'
import {
  getOrCreateDirectConversation,
  isConversationParticipant,
  markConversationRead,
} from '../../infrastructure/conversation.repository'
import { insertMessage } from '../../infrastructure/message.repository'
import { getConversationMessages } from '../queries/get-conversation-messages.queries'
import {
  getConversationHeader,
  listConversations,
  searchMessageableUsersQuery,
} from '../queries/list-conversations.queries'

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

export async function listConversationsAction(): Promise<ConversationListItemDto[]> {
  const userId = await requireAuthenticatedUserId()
  return listConversations(userId)
}

export async function searchMessageableUsersAction(query: string): Promise<MessageableUserDto[]> {
  await requireAuthenticatedUserId()
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  return searchMessageableUsersQuery(trimmed)
}

export async function openDirectConversationAction(otherUserId: string): Promise<string> {
  const userId = await requireAuthenticatedUserId()
  if (otherUserId === userId) throw new Error('No podés iniciar una conversación con vos mismo.')

  return getOrCreateDirectConversation(otherUserId)
}

export async function getConversationMessagesAction(conversationId: string): Promise<MessageDto[]> {
  const userId = await requireAuthenticatedUserId()
  return getConversationMessages(conversationId, userId)
}

export async function getConversationHeaderAction(conversationId: string) {
  const userId = await requireAuthenticatedUserId()
  const allowed = await isConversationParticipant(conversationId, userId)
  if (!allowed) throw new Error('No tenés acceso a esta conversación.')
  return getConversationHeader(conversationId, userId)
}

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1).max(4000),
})

export async function sendMessageAction(input: z.input<typeof sendMessageSchema>): Promise<MessageDto> {
  const parsed = sendMessageSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Mensaje inválido.')
  }

  const userId = await requireAuthenticatedUserId()
  const { conversationId, body } = parsed.data

  if (!isValidMessageBody(body)) {
    throw new Error('El mensaje no puede estar vacío.')
  }

  const allowed = await isConversationParticipant(conversationId, userId)
  if (!allowed) throw new Error('No tenés acceso a esta conversación.')

  const message = await insertMessage({
    conversationId,
    senderId: userId,
    body,
  })

  const supabase = await createClient()
  await supabase.schema('public').rpc('touch_user_last_seen')

  return message
}

export async function markConversationReadAction(conversationId: string): Promise<void> {
  const userId = await requireAuthenticatedUserId()
  const allowed = await isConversationParticipant(conversationId, userId)
  if (!allowed) throw new Error('No tenés acceso a esta conversación.')
  await markConversationRead(conversationId, userId)
}
