'use client'

import type { ConversationListItemDto } from '@/domains/community/chat/application/dto/conversation.dto'
import { messageConversationPath } from '@/shared/routing/routes'

import { ConversationListItem } from './ConversationListItem'

export function ConversationList({
  conversations,
  activeConversationId,
}: {
  conversations: ConversationListItemDto[]
  activeConversationId?: string | null
}) {
  if (conversations.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground'>
        No hay conversaciones para mostrar.
      </div>
    )
  }

  return (
    <div className='flex flex-col divide-y divide-border/60'>
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          active={conversation.id === activeConversationId}
          href={messageConversationPath(conversation.id)}
        />
      ))}
    </div>
  )
}
