'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getConversationHeaderAction,
  getConversationMessagesAction,
  markConversationReadAction,
  sendMessageAction,
} from '@/domains/community/chat/application/actions/messages.actions'
import type { ConversationHeaderDto } from '@/domains/community/chat/application/dto/conversation-header.dto'
import type { MessageDto } from '@/domains/community/chat/application/dto/message.dto'

import { ChatConversationHeader } from './ChatConversationHeader'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { usePolling } from './hooks/use-polling'

export function ConversationView({
  conversationId,
  showBackLink = false,
  onMessagesChange,
}: {
  conversationId: string
  showBackLink?: boolean
  onMessagesChange?: () => void
}) {
  const [header, setHeader] = useState<ConversationHeaderDto | null>(null)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try {
      const [nextHeader, nextMessages] = await Promise.all([
        getConversationHeaderAction(conversationId),
        getConversationMessagesAction(conversationId),
      ])
      setHeader(nextHeader)
      setMessages(nextMessages)
      setError(null)
      await markConversationReadAction(conversationId)
      onMessagesChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la conversación.')
    } finally {
      setLoading(false)
    }
  }, [conversationId, onMessagesChange])

  useEffect(() => {
    setLoading(true)
    void refresh()
  }, [refresh])

  usePolling(refresh, 10_000, Boolean(conversationId))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(body: string) {
    await sendMessageAction({ conversationId, body })
    await refresh()
  }

  if (loading && !header) {
    return (
      <div className='flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground'>
        Cargando…
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex flex-1 items-center justify-center p-6 text-sm text-destructive'>{error}</div>
    )
  }

  return (
    <div className='flex h-full min-h-0 flex-col'>
      {header ? <ChatConversationHeader header={header} showBackLink={showBackLink} /> : null}

      <div className='min-h-0 flex-1 space-y-3 overflow-y-auto p-4'>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            body={message.body}
            isOwn={message.isOwn}
            createdAt={message.createdAt}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className='shrink-0'>
        <MessageComposer onSend={handleSend} />
      </div>
    </div>
  )
}
