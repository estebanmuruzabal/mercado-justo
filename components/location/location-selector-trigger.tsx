'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { Dialog, DialogContent } from '@/components/ui/dialog'

import { useLocation } from '@/hooks/location/use-location'
import { useLocationStore } from '@/stores/location.store'

import { LocationOnboardingPopover } from './location-onboarding-popover'
import { LocationModeSwitch } from './location-mode-switch'
import { LocationSearchModal } from './location-search-modal'
import { LocationMapConfirmModal } from './location-map-confirm-modal'
import { LocationAdjustPinModal } from './location-adjust-pin-modal'
import type { LatLng } from '@/lib/location/location-types'

export function LocationSelectorTrigger() {
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number; width: number; height: number } | null>(
    null,
  )

  const {
    isOpen,
    step,
    showOnboardingPopover,
    draft,
    isAddressMismatch,
    geoStatus,
    geoError,
    open,
    close,
    onUnderstood,
    chooseMode,
    onUseCurrentLocation,
    onContinueFromSearch,
    onPinChange,
    confirmDelivery,
    startAdjust,
    backToSearch,
    backToMode,
    cancelAdjust,
    setDraftFromLatLng,
  } = useLocation()

  const confirmedMode = useLocationStore((s) => s.mode)
  const confirmedAddress = useLocationStore((s) => s.address)
  const confirmedCity = useLocationStore((s) => s.city)
  const updateAddressDraft = useLocationStore((s) => s.updateAddressDraft)

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

  // Search/confirm modals depend on store draft.
  const draftLatLng = useMemo(() => {
    if (draft.latitude == null || draft.longitude == null) return null
    return { latitude: draft.latitude, longitude: draft.longitude } satisfies LatLng
  }, [draft.latitude, draft.longitude])

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

      {/* Mode switch */}
      <Dialog
        open={isOpen && step === 'mode' && !showOnboardingPopover}
        onOpenChange={(next) => {
          if (!next) close()
        }}
      >
        <DialogContent className='max-w-2xl'>
          <div className='space-y-5 p-4'>
            <LocationModeSwitch
              onSelectDelivery={() => chooseMode('delivery')}
              onSelectPickup={() => chooseMode('pickup')}
            />
          </div>
        </DialogContent>
      </Dialog>

      <LocationSearchModal
        open={isOpen && step === 'search'}
        onOpenChange={(next) => {
          if (!next) close()
        }}
        onBack={() => backToMode()}
        geoStatus={geoStatus}
        geoError={geoError}
        onSelectSuggestion={(s) => {
          void (async () => {
            // Confirmamos siempre contra el bounds de Resistencia/Chaco en el hook.
            await setDraftFromLatLng({ latitude: s.latitude, longitude: s.longitude })
          })()
          // El address del search ya viene como string; usamos eso como draft rápido,
          // y el reverse geocode lo “corrige” luego desde el pin.
        }}
        onUseCurrentLocation={() => {
          void onUseCurrentLocation()
        }}
        canContinue={draft.latitude !== null && draft.longitude !== null && draft.isInResistencia}
        onContinue={() => {
          onContinueFromSearch()
        }}
      />

      <LocationMapConfirmModal
        open={isOpen && step === 'confirm'}
        onOpenChange={(next) => {
          if (!next) close()
        }}
        onBack={() => backToSearch()}
        onAdjust={() => startAdjust()}
        onPinChange={(latLng) => {
          void onPinChange(latLng)
        }}
        draftAddress={draft.address}
        onAddressChange={(next) => {
          // Editing address doesn't change lat/lng, but updates mismatch UI.
          updateAddressDraft({ address: next })
        }}
        draftLatLng={draftLatLng}
        isMismatch={isAddressMismatch}
        canConfirm={draft.latitude !== null && draft.longitude !== null && draft.address !== null && draft.isInResistencia}
        onConfirm={() => confirmDelivery()}
      />

      <LocationAdjustPinModal
        open={isOpen && step === 'adjust'}
        onOpenChange={(next) => {
          if (!next) cancelAdjust()
        }}
        onBack={() => cancelAdjust()}
        onPinChange={(latLng) => {
          void onPinChange(latLng)
        }}
        draftLatLng={draftLatLng}
        draftAddress={draft.address}
        onContinue={() => confirmDelivery()}
        onCancel={() => cancelAdjust()}
      />
    </div>
  )
}

