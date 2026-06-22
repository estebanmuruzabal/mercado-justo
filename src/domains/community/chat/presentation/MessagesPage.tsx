'use client'

import { useCallback, useEffect, useState } from 'react'

import { listConversationsAction } from '@/domains/community/chat/application/actions/messages.actions'
import type { ConversationListItemDto } from '@/domains/community/chat/application/dto/conversation.dto'
import { cn } from '@/shared/utils/utils'

import { ConversationListPanel } from './ConversationListPanel'
import { ConversationView } from './ConversationView'
import { usePolling } from './hooks/use-polling'

export function MessagesPageClient({
  activeConversationId = null,
}: {
  activeConversationId?: string | null
}) {
  const [conversations, setConversations] = useState<ConversationListItemDto[]>([])
  const [loading, setLoading] = useState(true)

  const refreshConversations = useCallback(async () => {
    try {
      const next = await listConversationsAction()
      setConversations(next)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshConversations()
  }, [refreshConversations])

  usePolling(refreshConversations, 10_000, true)

  const showMobileChat = Boolean(activeConversationId)

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-6xl',
        showMobileChat
          ? 'fixed inset-0 z-50 flex flex-col bg-background lg:static lg:z-auto lg:h-[calc(100dvh-5rem)] lg:px-4 lg:py-6'
          : 'h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-5rem)] lg:px-4 lg:py-6',
      )}
    >
      <div className='flex min-h-0 flex-1 overflow-hidden lg:rounded-xl lg:border lg:bg-background'>
        {!showMobileChat ? (
          <ConversationListPanel
            conversations={conversations}
            activeConversationId={activeConversationId}
            loading={loading}
            className='w-full lg:w-[min(100%,360px)] lg:shrink-0 lg:border-r'
          />
        ) : null}

        <section
          className={cn(
            'min-h-0 flex-1 flex-col bg-background',
            showMobileChat ? 'flex' : 'hidden lg:flex',
          )}
        >
          {activeConversationId ? (
            <ConversationView
              conversationId={activeConversationId}
              showBackLink
              onMessagesChange={refreshConversations}
            />
          ) : (
            <div className='hidden flex-1 items-center justify-center p-6 text-sm text-muted-foreground lg:flex'>
              Seleccioná una conversación para ver los mensajes.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
