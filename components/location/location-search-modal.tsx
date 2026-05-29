'use client'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

import { AddressSearchInput } from './address-search-input'
import { CurrentLocationButton } from './current-location-button'
import type { AddressSuggestion } from '@/lib/location/location-types'

export function LocationSearchModal({
  open,
  onOpenChange,
  onBack,
  geoStatus,
  geoError,
  onSelectSuggestion,
  onUseCurrentLocation,
  canContinue,
  onContinue,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBack: () => void
  geoStatus: string
  geoError: string | null
  onSelectSuggestion: (s: AddressSuggestion) => void
  onUseCurrentLocation: () => void
  canContinue: boolean
  onContinue: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl p-0'>
        <div className='space-y-4 p-5'>
          <div className='flex items-center gap-3'>
            <button type='button' onClick={onBack} className='rounded-full p-2 hover:bg-neutral-100'>
              <ArrowLeft className='h-5 w-5 text-neutral-900' />
            </button>
            <div className='flex-1 text-center'>
              <h2 className='text-xl font-bold text-neutral-900'>Ingresa tu dirección</h2>
            </div>
          </div>

          <AddressSearchInput onSelectSuggestion={onSelectSuggestion} />

          <div className='pt-1'>
            <CurrentLocationButton
              onClick={onUseCurrentLocation}
              disabled={geoStatus === 'requesting'}
              error={geoError}
            />
          </div>

          <div className='pt-2'>
            <Button
              type='button'
              disabled={!canContinue}
              onClick={onContinue}
              className='w-full rounded-full bg-[#FF385C] py-3 text-sm font-semibold text-white hover:bg-[#e0314f] transition-colors disabled:opacity-50'
            >
              Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

