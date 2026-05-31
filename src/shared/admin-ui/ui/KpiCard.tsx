import type { ComponentType } from 'react'

import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/shared/utils/utils'

export type KpiCardProps = {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
  hint?: string
  accentClass?: string
}

export function KpiCard({ label, value, icon: Icon, hint, accentClass }: KpiCardProps) {
  return (
    <Card className='py-0'>
      <CardContent className='flex items-start justify-between gap-3 p-4'>
        <div className='space-y-1'>
          <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>{label}</p>
          <p className='text-2xl font-bold tracking-tight'>{value}</p>
          {hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary', accentClass)}>
          <Icon className='h-5 w-5' />
        </div>
      </CardContent>
    </Card>
  )
}

export function KpiCardSkeleton() {
  return (
    <Card className='py-0'>
      <CardContent className='flex items-start justify-between gap-3 p-4'>
        <div className='space-y-2'>
          <Skeleton className='h-3 w-20' />
          <Skeleton className='h-7 w-16' />
        </div>
        <Skeleton className='h-10 w-10 rounded-xl' />
      </CardContent>
    </Card>
  )
}
