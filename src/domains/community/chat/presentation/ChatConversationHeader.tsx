'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import type { ConversationHeaderDto } from '@/domains/community/chat/application/dto/conversation-header.dto'
import { MESSAGES_PATH } from '@/shared/routing/routes'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/utils'

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export function ChatConversationHeader({
  header,
  showBackLink = false,
  className,
}: {
  header: ConversationHeaderDto
  showBackLink?: boolean
  className?: string
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b bg-background px-4 py-3',
        className,
      )}
    >
      {showBackLink ? (
        <Button variant='ghost' size='icon' asChild className='shrink-0 lg:hidden'>
          <Link href={MESSAGES_PATH} aria-label='Volver'>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
      ) : null}

      <Avatar className='size-10 shrink-0'>
        {header.avatarUrl ? (
          <AvatarImage src={header.avatarUrl} alt={header.displayName} />
        ) : null}
        <AvatarFallback>{initials(header.displayName)}</AvatarFallback>
      </Avatar>

      <div className='min-w-0 flex-1'>
        <p className='truncate font-semibold text-foreground'>{header.displayName}</p>
        <p className='truncate text-xs text-muted-foreground'>{header.presenceLabel}</p>
      </div>
    </header>
  )
}
