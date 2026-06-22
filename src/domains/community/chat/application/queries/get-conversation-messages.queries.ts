import type { MessageDto } from '../dto/message.dto'
import { isConversationParticipant } from '../../infrastructure/conversation.repository'
import { listMessagesForConversation } from '../../infrastructure/message.repository'

export async function getConversationMessages(
  conversationId: string,
  currentUserId: string,
): Promise<MessageDto[]> {
  const allowed = await isConversationParticipant(conversationId, currentUserId)
  if (!allowed) throw new Error('No tenés acceso a esta conversación.')

  return listMessagesForConversation(conversationId, currentUserId)
}
