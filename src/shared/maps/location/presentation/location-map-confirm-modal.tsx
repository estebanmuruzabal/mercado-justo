'use client'

import { ArrowLeft, Navigation } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'

import { LocationMapPicker } from './location-map-picker'

export function LocationMapConfirmModal({
  open,
  onOpenChange,
  onBack,
  onAdjust,
  onPinChange,
  draftAddress,
  onAddressChange,
  draftLatLng,
  isMismatch,
  canConfirm,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBack: () => void
  onAdjust: () => void
  onPinChange: (latLng: { latitude: number; longitude: number }) => void
  draftAddress: string | null
  onAddressChange: (next: string) => void
  draftLatLng: { latitude: number; longitude: number } | null
  isMismatch: boolean
  canConfirm: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl p-0'>
        <div className='flex flex-col'>
          <div className='flex items-center gap-3 border-b border-neutral-100 p-4'>
            <button type='button' onClick={onBack} className='rounded-full p-2 hover:bg-neutral-100'>
              <ArrowLeft className='h-5 w-5 text-neutral-900' />
            </button>
            <div className='flex-1'>
              <h2 className='text-lg font-bold'>Confirma tu dirección</h2>
            </div>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50'>
              <Navigation className='h-4 w-4 text-[#FF385C]' />
            </div>
          </div>

          <div className='relative'>
            <LocationMapPicker
              value={draftLatLng}
              onChange={onPinChange}
              heightClassName='h-[260px] md:h-[320px]'
              enableClickToPlace={false}
            />

            {isMismatch ? (
              <div className='absolute left-3 right-3 top-3 z-10 rounded-2xl bg-[#1D4ED8] px-4 py-3 text-white shadow-lg'>
                <div className='font-semibold'>¿El pin y la dirección no coinciden?</div>
                <div className='mt-0.5 text-sm opacity-90'>
                  Si no coincide con tu dirección, ajustalo manualmente.
                </div>
                <div className='mt-3'>
                  <Button
                    type='button'
                    onClick={onAdjust}
                    className='rounded-full bg-white text-neutral-900 hover:bg-neutral-100'
                  >
                    Ajustar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className='space-y-3 p-5'>
            <div className='space-y-1'>
              <div className='text-sm font-semibold text-neutral-700'>Dirección</div>
              <Input
                value={draftAddress ?? ''}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder='Dirección'
                className='h-12 rounded-2xl'
              />
            </div>

            <Button
              type='button'
              disabled={!canConfirm}
              onClick={onConfirm}
              className='w-full rounded-full bg-[#FF385C] py-3 text-sm font-semibold text-white hover:bg-[#e0314f] transition-colors disabled:opacity-50'
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

