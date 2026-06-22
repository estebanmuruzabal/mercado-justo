export function hasUnreadMessages(input: {
  lastReadAt: string | null
  lastMessageAt: string | null
  lastMessageSenderId: string | null
  currentUserId: string
}): boolean {
  const { lastReadAt, lastMessageAt, lastMessageSenderId, currentUserId } = input
  if (!lastMessageAt || !lastMessageSenderId) return false
  if (lastMessageSenderId === currentUserId) return false

  if (!lastReadAt) return true
  return new Date(lastMessageAt).getTime() > new Date(lastReadAt).getTime()
}
