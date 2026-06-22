'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import type { ConversationListItemDto } from '@/domains/community/chat/application/dto/conversation.dto'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/utils/utils'

import { ConversationList } from './ConversationList'
import { NewConversationDialog } from './NewConversationDialog'

type InboxFilter = 'all' | 'unread'

export function ConversationListPanel({
  conversations,
  activeConversationId,
  loading,
  className,
}: {
  conversations: ConversationListItemDto[]
  activeConversationId?: string | null
  loading?: boolean
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<InboxFilter>('all')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return conversations.filter((conversation) => {
      if (filter === 'unread' && !conversation.unread) return false
      if (!normalized) return true

      const name = conversation.otherParticipant.displayName.toLowerCase()
      const preview = (conversation.lastMessagePreview ?? '').toLowerCase()
      return name.includes(normalized) || preview.includes(normalized)
    })
  }, [conversations, filter, query])

  return (
    <aside className={cn('flex min-h-0 flex-col bg-background', className)}>
      <div className='shrink-0 space-y-3 border-b px-4 py-4'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='text-2xl font-bold tracking-tight'>Chats</h1>
          <NewConversationDialog variant='icon' />
        </div>

        <div className='relative'>
          <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Buscar en mensajes'
            className='rounded-full bg-muted/50 pl-9'
          />
        </div>

        <div className='flex gap-2'>
          <FilterChip
            active={filter === 'all'}
            label='Todos'
            onClick={() => setFilter('all')}
          />
          <FilterChip
            active={filter === 'unread'}
            label='No leídos'
            onClick={() => setFilter('unread')}
          />
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto'>
        {loading ? (
          <div className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
            Cargando conversaciones…
          </div>
        ) : (
          <ConversationList
            conversations={filtered}
            activeConversationId={activeConversationId}
          />
        )}
      </div>
    </aside>
  )
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
