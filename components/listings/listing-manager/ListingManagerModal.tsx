'use client'

import type { TemplateDef } from '@/lib/product'
import type { DraftFormState, ModalStep } from './types'
import type { VariantEditorValue } from '@/components/listings/variants/VariantCard'

import type { Dispatch, SetStateAction } from 'react'

import type { ListingManagerRow } from '@/server/actions/listing-manager.actions'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
  rootCategories,
  childrenByParent,
  categoryOptionsAtLevel,
  setCategoryAtLevel,
  deepestSelectedOk,
  listingTypeLabel,
  formBusy,
  formError,
  handleStep1Next,
  handleStep2Next,
  handleSaveDraft,
  handlePublish,
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
  rootCategories: Array<{ id: string }>
  childrenByParent: Map<string, Array<{ id: string }>>
  categoryOptionsAtLevel: (level: number) => Array<{ id: string; name: string }>
  setCategoryAtLevel: (level: number, categoryId: string) => void
  deepestSelectedOk: boolean
  listingTypeLabel: (listingType: DraftFormState['listingType']) => string
  formBusy: boolean
  formError: string | null
  handleStep1Next: () => Promise<void> | void
  handleStep2Next: () => Promise<void> | void
  handleSaveDraft: () => Promise<void> | void
  handlePublish: () => Promise<void> | void
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
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {form.listingId ? 'Edit Listing' : 'Create Listing'} — Step {step}/3
            </DialogTitle>
          </DialogHeader>

          {step === 1 ? (
            <ListingModalStep1
              form={form}
              formError={formError}
              formBusy={formBusy}
              deepestSelectedOk={deepestSelectedOk}
              byId={byId}
              childrenByParent={childrenByParent}
              rootCategories={rootCategories}
              categoryOptionsAtLevel={categoryOptionsAtLevel}
              setCategoryAtLevel={setCategoryAtLevel}
              listingTypeLabel={(lt) => listingTypeLabel(lt)}
              onContinue={() => void handleStep1Next()}
            />
          ) : step === 2 ? (
            <ListingModalStep2
              template={template}
              form={form}
              setForm={setForm}
              variants={variants}
              variantsLoading={variantsLoading}
              setVariants={setVariants}
              formBusy={formBusy}
              formError={formError}
              onBack={() => setStep(1)}
              onNext={() => void handleStep2Next()}
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

