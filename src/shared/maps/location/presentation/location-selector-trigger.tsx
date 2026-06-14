'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { useLocationStore } from '@/shared/maps/location/presentation/stores/location.store'

import { useLocationContext } from './location-context'
import { LocationOnboardingPopover } from './location-onboarding-popover'

export function LocationSelectorTrigger() {
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number; width: number; height: number } | null>(
    null,
  )

  const { showOnboardingPopover, isOpen, open, onUnderstood } = useLocationContext()

  const confirmedMode = useLocationStore((s) => s.mode)
  const confirmedAddress = useLocationStore((s) => s.address)
  const confirmedCity = useLocationStore((s) => s.city)

  const pillText = useMemo(() => {
    if (confirmedMode === 'pickup') return 'Retiro'
    if (confirmedMode === 'delivery') return 'Envío'
    return 'Envío / Retiro'
  }, [confirmedMode])

  const pillSubline = useMemo(() => {
    if (confirmedMode !== 'delivery' || !confirmedAddress) return null
    if (!confirmedCity) return confirmedAddress
    return `${confirmedAddress}`
  }, [confirmedMode, confirmedAddress, confirmedCity])

  useEffect(() => {
    if (!showOnboardingPopover) return
    if (!btnRef.current) return
    setAnchorRect(btnRef.current.getBoundingClientRect())
  }, [showOnboardingPopover])

  useEffect(() => {
    if (!isOpen) setAnchorRect(null)
  }, [isOpen])

  return (
    <div className='relative'>
      <button
        ref={btnRef}
        type='button'
        onClick={open}
        className='flex w-full items-center justify-between rounded-full border border-neutral-200 bg-white px-4 py-2.5 shadow-xs transition-colors hover:bg-neutral-50'
      >
        <div className='text-left'>
          <div className='text-xs font-semibold text-neutral-700'>{pillText}</div>
          {pillSubline ? <div className='truncate text-sm font-semibold text-neutral-900'>{pillSubline}</div> : null}
        </div>
        <ChevronDown className='ml-3 h-4 w-4 text-neutral-500' />
      </button>

      <LocationOnboardingPopover open={showOnboardingPopover} anchorRect={anchorRect} onUnderstood={onUnderstood} />
    </div>
  )
}
