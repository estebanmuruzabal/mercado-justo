'use client'

import { useMemo } from 'react'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useLocationStore } from '@/stores/location.store'
import type { LatLng } from '@/lib/location/location-types'

import { useLocationContext } from './location-context'
import { LocationModeSwitch } from './location-mode-switch'
import { LocationSearchModal } from './location-search-modal'
import { LocationMapConfirmModal } from './location-map-confirm-modal'
import { LocationAdjustPinModal } from './location-adjust-pin-modal'

export function LocationModals() {
  const {
    isOpen,
    step,
    showOnboardingPopover,
    draft,
    isAddressMismatch,
    geoStatus,
    geoError,
    close,
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
  } = useLocationContext()

  const updateAddressDraft = useLocationStore((s) => s.updateAddressDraft)

  const draftLatLng = useMemo(() => {
    if (draft.latitude == null || draft.longitude == null) return null
    return { latitude: draft.latitude, longitude: draft.longitude } satisfies LatLng
  }, [draft.latitude, draft.longitude])

  return (
    <>
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
          void setDraftFromLatLng({ latitude: s.latitude, longitude: s.longitude })
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
          updateAddressDraft({ address: next })
        }}
        draftLatLng={draftLatLng}
        isMismatch={isAddressMismatch}
        canConfirm={
          draft.latitude !== null &&
          draft.longitude !== null &&
          draft.address !== null &&
          draft.isInResistencia
        }
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
    </>
  )
}
