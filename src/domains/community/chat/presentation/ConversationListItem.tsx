'use client'

import Link from 'next/link'

import type { ConversationListItemDto } from '@/domains/community/chat/application/dto/conversation.dto'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { cn } from '@/shared/utils/utils'

import { formatConversationTime } from './format-conversation-time'

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export function ConversationListItem({
  conversation,
  active,
  href,
}: {
  conversation: ConversationListItemDto
  active?: boolean
  href: string
}) {
  const { otherParticipant, lastMessagePreview, lastMessageAt, unread } = conversation

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
        active && 'bg-muted/70',
      )}
    >
      <Avatar className='size-14 shrink-0'>
        {otherParticipant.avatarUrl ? (
          <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.displayName} />
        ) : null}
        <AvatarFallback className='text-base'>{initials(otherParticipant.displayName)}</AvatarFallback>
      </Avatar>

      <div className='min-w-0 flex-1'>
        <div className='flex items-baseline justify-between gap-2'>
          <p
            className={cn(
              'truncate text-[15px] text-foreground',
              unread ? 'font-semibold' : 'font-medium',
            )}
          >
            {otherParticipant.displayName}
          </p>
          {lastMessageAt ? (
            <time
              className='shrink-0 text-xs text-muted-foreground'
              dateTime={lastMessageAt}
            >
              {formatConversationTime(lastMessageAt)}
            </time>
          ) : null}
        </div>

        <div className='mt-0.5 flex items-center gap-2'>
          <p
            className={cn(
              'min-w-0 flex-1 truncate text-sm',
              unread ? 'font-medium text-foreground' : 'text-muted-foreground',
            )}
          >
            {lastMessagePreview ?? 'Sin mensajes todavía'}
          </p>
          {unread ? (
            <span
              className='size-2.5 shrink-0 rounded-full bg-primary'
              aria-label='No leído'
            />
          ) : null}
        </div>
      </div>
    </Link>
  )
}
