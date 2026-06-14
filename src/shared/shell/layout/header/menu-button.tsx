'use client'

import { Menu } from 'lucide-react'

import { cn } from '@/shared/utils/utils'

export function MenuButton({
  onClick,
  className,
  isActive,
}: {
  onClick: () => void
  className?: string
  isActive?: boolean
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label='Menú'
      aria-expanded={isActive}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 transition-colors hover:bg-neutral-200',
        isActive && 'bg-neutral-200',
        className,
      )}
    >
      <Menu className='h-5 w-5' aria-hidden='true' />
    </button>
  )
}
