'use client'

import type { Dispatch, SetStateAction } from 'react'

import type { TemplateDef } from '@/lib/product'
import type { DraftFormState } from './types'
import type { VariantEditorValue } from '@/components/listings/variants/VariantCard'

import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { ListingModalCharacteristicFields } from './ListingModalCharacteristicFields'
import { ListingLocationPicker } from '@/components/vendor/location/listing-location-picker'

export function ListingModalStep2({
  template,
  form,
  setForm,
  variants,
  variantsLoading,
  setVariants,
  formBusy,
  formError,
  sellerLocation,
  onBack,
  onNext,
}: {
  template: TemplateDef
  form: DraftFormState
  setForm: Dispatch<SetStateAction<DraftFormState>>
  variants: VariantEditorValue[]
  variantsLoading: boolean
  setVariants: Dispatch<SetStateAction<VariantEditorValue[]>>
  formBusy: boolean
  formError: string | null
  sellerLocation: { latitude: number | null; longitude: number | null } | null
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className='space-y-5'>
      <div className='space-y-1'>
        <Label>Step 2 — Basic Information</Label>
        <p className='text-sm text-muted-foreground'>Completá la info básica y elegí si este producto tiene variantes.</p>
      </div>

      {form.listingType === 'product' ? (
        <ListingLocationPicker
          value={{ latitude: form.latitude, longitude: form.longitude }}
          sellerLocation={sellerLocation}
          disabled={formBusy}
          onChange={(next) => setForm((c) => ({ ...c, latitude: next.latitude, longitude: next.longitude }))}
        />
      ) : null}

      <ListingModalCharacteristicFields
        template={template}
        form={form}
        setForm={setForm}
        variants={variants}
        variantsLoading={variantsLoading}
        setVariants={setVariants}
      />

      {!form.enableVariants ? (
        <div className='space-y-2 rounded-xl border bg-background p-4'>
          <div className='space-y-1'>
            <Label htmlFor='simplePrice'>Price</Label>
            <Input
              id='simplePrice'
              type='number'
              min='0.01'
              step='0.01'
              value={form.simplePrice ?? ''}
              onChange={(e) =>
                setForm((c) => ({ ...c, simplePrice: e.target.value === '' ? null : Number(e.target.value) }))
              }
            />
          </div>

          <div className='space-y-1'>
            <Label htmlFor='simpleSku'>SKU (opcional)</Label>
            <Input
              id='simpleSku'
              value={form.simpleSku ?? ''}
              onChange={(e) => setForm((c) => ({ ...c, simpleSku: e.target.value === '' ? null : e.target.value }))}
              placeholder='e.g. rem-nero'
            />
          </div>
        </div>
      ) : null}

      {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

      <DialogFooter className='pt-2'>
        <div className='flex w-full items-center justify-between gap-2'>
          <Button type='button' variant='outline' disabled={formBusy} onClick={onBack}>
            Back
          </Button>

          <Button
            type='button'
            disabled={formBusy || (form.simplePrice == null && !form.enableVariants)}
            onClick={() => onNext()}
          >
            {formBusy ? 'Guardando…' : 'Next: Review'}
          </Button>
        </div>
      </DialogFooter>
    </div>
  )
}

