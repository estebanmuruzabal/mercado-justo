'use client'

import { Check, ChevronDown, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { CheckoutSectionVisualState } from '@/lib/checkout/types'

export function CheckoutSectionHeader({
  title,
  state,
  summary,
  disabled,
  onToggle,
}: {
  title: string
  state: CheckoutSectionVisualState
  summary?: string | null
  disabled?: boolean
  onToggle: () => void
}) {
  const isEditing = state === 'editing'
  const isComplete = state === 'valid' || state === 'collapsed'
  const isInvalid = state === 'invalid'

  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'flex w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        isEditing && 'border-[#FF385C] ring-2 ring-[#FF385C]/20',
        !isEditing && !disabled && 'border-neutral-200 hover:bg-neutral-50',
        isComplete && !isEditing && 'border-neutral-200',
        isInvalid && !isEditing && 'border-red-200',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          isComplete && 'bg-emerald-100 text-emerald-700',
          isInvalid && 'bg-red-100 text-red-600',
          !isComplete && !isInvalid && 'bg-neutral-100 text-neutral-500',
        )}
        aria-hidden
      >
        {isComplete ? <Check className='h-4 w-4' /> : isInvalid ? <X className='h-4 w-4' /> : null}
      </span>

      <span className='min-w-0 flex-1'>
        <span className='block text-sm font-semibold text-neutral-900'>{title}</span>
        {isInvalid && !isEditing ? (
          <span className='mt-0.5 block text-sm text-red-600'>Incompleto</span>
        ) : summary && !isEditing ? (
          <span className='mt-0.5 block truncate text-sm text-neutral-600'>{summary}</span>
        ) : null}
      </span>

      <ChevronDown
        className={cn(
          'mt-1 h-5 w-5 shrink-0 text-neutral-500 transition-transform',
          isEditing && 'rotate-180',
        )}
        aria-hidden
      />
    </button>
  )
}
