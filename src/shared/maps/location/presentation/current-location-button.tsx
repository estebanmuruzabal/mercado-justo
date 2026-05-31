'use client'

import { MapPin } from 'lucide-react'

import { Button } from '@/shared/ui/button'

export function CurrentLocationButton({
  onClick,
  disabled,
  error,
}: {
  onClick: () => void
  disabled?: boolean
  error?: string | null
}) {
  return (
    <div className='space-y-2'>
      <Button
        type='button'
        variant='secondary'
        disabled={disabled}
        onClick={onClick}
        className='w-full rounded-2xl bg-white shadow-sm hover:bg-neutral-50'
      >
        <MapPin className='mr-2 h-4 w-4 text-[#FF385C]' />
        Mi ubicación actual
      </Button>
      {error ? <div className='text-sm text-destructive'>{error}</div> : null}
    </div>
  )
}

