import { MessagesPageClient } from '@/domains/community/chat'

export default async function MessageConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  return <MessagesPageClient activeConversationId={conversationId} />
}
