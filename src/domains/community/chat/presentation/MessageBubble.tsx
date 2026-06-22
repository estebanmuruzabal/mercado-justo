'use client'

import { cn } from '@/shared/utils/utils'

export function MessageBubble({
  body,
  isOwn,
  createdAt,
}: {
  body: string
  isOwn: boolean
  createdAt: string
}) {
  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        <p>{body}</p>
        <time
          className={cn(
            'mt-1 block text-[10px]',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
          dateTime={createdAt}
        >
          {new Date(createdAt).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>
    </div>
  )
}
