import type { ConversationHeaderDto } from '../dto/conversation-header.dto'
import type { ConversationListItemDto } from '../dto/conversation.dto'
import type { MessageableUserDto } from '../dto/messageable-user.dto'
import {
  getOtherParticipant,
  listConversationsForUser,
  searchMessageableUsers,
} from '../../infrastructure/conversation.repository'

export async function listConversations(userId: string): Promise<ConversationListItemDto[]> {
  return listConversationsForUser(userId)
}

export async function searchMessageableUsersQuery(
  query: string,
  limit?: number,
): Promise<MessageableUserDto[]> {
  return searchMessageableUsers(query, limit)
}

export async function getConversationHeader(
  conversationId: string,
  currentUserId: string,
): Promise<ConversationHeaderDto | null> {
  return getOtherParticipant(conversationId, currentUserId)
}
