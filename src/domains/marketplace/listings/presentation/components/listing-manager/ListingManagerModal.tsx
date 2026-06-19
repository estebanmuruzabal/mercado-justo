'use client'

import type { TemplateDef } from '@/domains/marketplace/listings/domain/product'
import type { DraftFormState, ModalStep } from './types'
import type { VariantEditorValue } from '@/domains/marketplace/listings/presentation/components/variants/VariantCard'

import type { Dispatch, SetStateAction } from 'react'

import type { ListingManagerRow } from '@/domains/marketplace/listings/application/actions/listing-manager.actions'
import type { ProductBaseSearchResultDto } from '@/domains/marketplace/product-base/application/dto/product-base-search.dto'
import type { PendingListingImage } from '@/domains/marketplace/listings/presentation/utils/pending-listing-image'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'

import { ListingModalStep1 } from './ListingModalStep1'
import { ListingModalStep2 } from './ListingModalStep2'
import { ListingModalReview } from './ListingModalReview'

export function ListingManagerModal({
  modalOpen,
  setModalOpen,
  step,
  setStep,
  form,
  template,
  byId,
  listingTypeLabel,
  onProductBaseSelect,
  onIdentificationImageCaptured,
  onPendingImagesChange,
  formBusy,
  formError,
  handleStep1Next,
  handleStep2Next,
  handleSaveDraft,
  handlePublish,
  sellerLocation,
  variants,
  variantsLoading,
  setVariants,
  setForm,
  deleteCandidate,
  setDeleteCandidate,
  deleteBusy,
  handleDeleteConfirmed,
}: {
  modalOpen: boolean
  setModalOpen: (open: boolean) => void
  step: ModalStep
  setStep: (s: ModalStep) => void
  form: DraftFormState
  template: TemplateDef
  byId: Map<string, { name?: string | null }>
  listingTypeLabel: (listingType: DraftFormState['listingType']) => string
  onProductBaseSelect: (result: ProductBaseSearchResultDto) => void
  onIdentificationImageCaptured: (file: File) => void | Promise<void>
  onPendingImagesChange: (pendingImages: PendingListingImage[]) => void
  formBusy: boolean
  formError: string | null
  handleStep1Next: () => Promise<void> | void
  handleStep2Next: () => Promise<void> | void
  handleSaveDraft: () => Promise<void> | void
  handlePublish: () => Promise<void> | void
  sellerLocation: { latitude: number | null; longitude: number | null } | null
  variants: VariantEditorValue[]
  variantsLoading: boolean
  setVariants: Dispatch<SetStateAction<VariantEditorValue[]>>
  setForm: Dispatch<SetStateAction<DraftFormState>>
  deleteCandidate: ListingManagerRow | null
  setDeleteCandidate: (next: ListingManagerRow | null) => void
  deleteBusy: boolean
  handleDeleteConfirmed: () => Promise<void> | void
}) {
  return (
    <>
      <Dialog open={modalOpen} onOpenChange={(open) => setModalOpen(open)}>
        <DialogContent className='max-w-md sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col'>
          <DialogHeader>
            <DialogTitle>
              {form.listingId ? 'Editar publicación' : 'Publicar'} — Paso {step}/3
            </DialogTitle>
          </DialogHeader>

          {step === 1 ? (
            <ListingModalStep1
              form={form}
              formError={formError}
              formBusy={formBusy}
              listingTypeLabel={(lt) => listingTypeLabel(lt)}
              onProductBaseSelect={onProductBaseSelect}
              onIdentificationImageCaptured={onIdentificationImageCaptured}
              onContinue={() => void handleStep1Next()}
            />
          ) : step === 2 ? (
            <ListingModalStep2
              template={template}
              form={form}
              setForm={setForm}
              sellerLocation={sellerLocation}
              variants={variants}
              variantsLoading={variantsLoading}
              setVariants={setVariants}
              formBusy={formBusy}
              formError={formError}
              onBack={() => setStep(1)}
              onNext={() => void handleStep2Next()}
              onPendingImagesChange={onPendingImagesChange}
            />
          ) : (
            <ListingModalReview
              form={form}
              variants={variants}
              byId={byId}
              formBusy={formBusy}
              formError={formError}
              onBack={() => setStep(2)}
              onSaveDraft={() => void handleSaveDraft()}
              onPublish={() => void handlePublish()}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteCandidate)} onOpenChange={(open) => (!open ? setDeleteCandidate(null) : null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
          </DialogHeader>

          <p className='text-sm text-muted-foreground'>
            ¿Seguro que querés eliminar este listing? Esta acción no se puede deshacer.
          </p>

          <DialogFooter className='pt-4'>
            <Button variant='outline' disabled={deleteBusy} onClick={() => setDeleteCandidate(null)}>
              Cancel
            </Button>
            <Button variant='destructive' disabled={deleteBusy} onClick={() => void handleDeleteConfirmed()}>
              {deleteBusy ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

