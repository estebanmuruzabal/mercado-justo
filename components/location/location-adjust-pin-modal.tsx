'use client'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

import { LocationMapPicker } from './location-map-picker'
import { Input } from '@/components/ui/input'

export function LocationAdjustPinModal({
  open,
  onOpenChange,
  onBack,
  onPinChange,
  draftLatLng,
  draftAddress,
  onContinue,
  onCancel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBack: () => void
  onPinChange: (latLng: { latitude: number; longitude: number }) => void
  draftLatLng: { latitude: number; longitude: number } | null
  draftAddress: string | null
  onContinue: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-none w-full h-full p-0 top-0 left-0 translate-x-0 translate-y-0 rounded-none'>
        <div className='flex h-full flex-col'>
          <div className='flex items-center gap-3 border-b border-neutral-100 p-4'>
            <button type='button' onClick={onBack} className='rounded-full p-2 hover:bg-neutral-100'>
              <ArrowLeft className='h-5 w-5 text-neutral-900' />
            </button>
            <div className='flex-1'>
              <h2 className='text-lg font-bold'>Ajusta el pin</h2>
              <div className='text-sm text-neutral-500'>Ubícalo en el lugar exacto de tu dirección.</div>
            </div>
            <div />
          </div>

          <div className='relative flex-1'>
            <LocationMapPicker
              value={draftLatLng}
              onChange={onPinChange}
              heightClassName='h-full'
              enableClickToPlace={true}
            />
          </div>

          <div className='flex items-center gap-3 border-t border-neutral-100 p-4'>
            <div className='flex-1'>
              <div className='text-sm font-semibold text-neutral-700'>Dirección</div>
              <Input value={draftAddress ?? ''} readOnly className='mt-1 h-11 rounded-2xl' />
            </div>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              className='flex-1 rounded-full border-neutral-200 bg-white hover:bg-neutral-50'
            >
              Cancelar
            </Button>
            <Button
              type='button'
              onClick={onContinue}
              className='flex-1 rounded-full bg-[#FF385C] hover:bg-[#e0314f] text-white'
            >
              Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

