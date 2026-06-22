export type ConversationParticipantDto = {
  id: string
  displayName: string
  avatarUrl: string | null
}

export type ConversationListItemDto = {
  id: string
  otherParticipant: ConversationParticipantDto
  lastMessagePreview: string | null
  lastMessageAt: string | null
  unread: boolean
}
