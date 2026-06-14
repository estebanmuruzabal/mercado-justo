'use client'

import type { ReactNode } from 'react'

import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/utils/utils'

export type ListingSectionStatus = 'complete' | 'incomplete' | 'error'

const STATUS_STYLES: Record<ListingSectionStatus, string> = {
  complete: 'border-green-200 bg-green-50 text-green-700',
  incomplete: 'border-amber-200 bg-amber-50 text-amber-700',
  error: 'border-red-200 bg-red-50 text-red-700',
}

const STATUS_LABELS: Record<ListingSectionStatus, string> = {
  complete: 'Completo',
  incomplete: 'Faltante',
  error: 'Error',
}

export function ListingSection({
  title,
  description,
  status,
  defaultOpen = false,
  children,
}: {
  title: string
  description?: string
  status: ListingSectionStatus
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details
      className='rounded-xl border bg-background'
      defaultOpen={defaultOpen}
    >
      <summary className='flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3'>
        <div className='min-w-0'>
          <p className='text-sm font-semibold text-foreground'>{title}</p>
          {description ? <p className='text-xs text-muted-foreground'>{description}</p> : null}
        </div>

        <Badge className={cn('shrink-0 border px-2 py-0.5 text-xs font-medium', STATUS_STYLES[status])}>
          {STATUS_LABELS[status]}
        </Badge>
      </summary>

      <div className='border-t px-4 py-4'>
        {children}
      </div>
    </details>
  )
}

