'use client'

import type { Dispatch, SetStateAction } from 'react'

import type { TemplateDef } from '@/domains/marketplace/listings/domain/product'
import type { DraftFormState } from './types'
import type { VariantEditorValue } from '@/domains/marketplace/listings/presentation/components/variants/VariantCard'

import { Button } from '@/shared/ui/button'
import { DialogFooter } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Skeleton } from '@/shared/ui/skeleton'

import { ListingModalCharacteristicFields } from './ListingModalCharacteristicFields'
import { ProductBaseAttributeFields } from './product-base/ProductBaseAttributeFields'
import { ListingImagesEditor } from './product-base/ListingImagesEditor'
import { ListingLocationPicker } from '@/domains/vendors/presentation/shared/location/listing-location-picker'
import { VariantEditor } from '@/domains/marketplace/listings/presentation/components/variants/VariantEditor'

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
  const canEditListingLocation = form.listingType === 'product' || form.listingType === 'dittobot'
  const canUploadListingImages =
    form.productBase?.imageStrategy === 'LISTING_REQUIRED' ||
    form.productBase?.imageStrategy === 'BASE_OR_LISTING'

  return (
    <div className='space-y-5'>
      <div className='space-y-1'>
        <Label>Step 2 — Basic Information</Label>
        <p className='text-sm text-muted-foreground'>Completá la info básica y elegí si este producto tiene variantes.</p>
      </div>

      {form.productBase ? (
        <div className='space-y-2 rounded-xl border bg-background p-4'>
          <Label>Title</Label>
          <p className='text-sm font-semibold'>{form.productBase.name}</p>
          <p className='text-xs text-muted-foreground'>
            El título del listing se toma del nombre del Product Base y no se puede modificar.
          </p>
        </div>
      ) : null}

      {canEditListingLocation ? (
        <ListingLocationPicker
          value={{ latitude: form.latitude, longitude: form.longitude }}
          sellerLocation={sellerLocation}
          disabled={formBusy}
          onChange={(next) => setForm((c) => ({ ...c, latitude: next.latitude, longitude: next.longitude }))}
        />
      ) : null}

      {canUploadListingImages ? (
        <ListingImagesEditor
          listingId={form.listingId}
          images={form.images}
          required={form.productBase?.imageStrategy === 'LISTING_REQUIRED'}
          disabled={formBusy}
          onChange={(images) => setForm((current) => ({ ...current, images }))}
        />
      ) : null}

      {form.productBase ? (
        <>
          <ProductBaseAttributeFields
            productBase={form.productBase}
            values={form.characteristics}
            disabled={formBusy}
            onChange={(characteristics) => setForm((current) => ({ ...current, characteristics }))}
          />

          <div className='space-y-3 rounded-xl border bg-background p-4'>
            <div className='flex items-center justify-between gap-4'>
              <div className='space-y-0.5'>
                <Label>Enable variants</Label>
                <p className='text-xs text-muted-foreground'>
                  Si activás variantes, el precio y stock se definen en cada variante.
                </p>
              </div>
              <input
                type='checkbox'
                checked={form.enableVariants}
                disabled={formBusy}
                onChange={(e) => setForm((current) => ({ ...current, enableVariants: e.target.checked }))}
                aria-label='Enable variants'
              />
            </div>

            {form.enableVariants ? (
              <div className='space-y-5'>
                <div className='space-y-1'>
                  <Label>Variants</Label>
                  <p className='text-sm text-muted-foreground'>
                    Agregá variantes comprables. Cada variante tiene su propio precio y stock.
                  </p>
                </div>

                {variantsLoading ? (
                  <div className='space-y-3'>
                    <Skeleton className='h-6 w-40' />
                    <Skeleton className='h-24 w-full' />
                  </div>
                ) : (
                  <VariantEditor variants={variants} onChange={setVariants} />
                )}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <ListingModalCharacteristicFields
          template={template}
          form={form}
          setForm={setForm}
          variants={variants}
          variantsLoading={variantsLoading}
          setVariants={setVariants}
        />
      )}

      {!form.enableVariants ? (
        <div className='space-y-2 rounded-xl border bg-background p-4'>
          <div className='space-y-1'>
            <Label htmlFor='simpleStock'>Stock</Label>
            <Input
              id='simpleStock'
              type='number'
              min='0'
              step='1'
              value={form.stock}
              disabled={formBusy}
              onChange={(e) => setForm((c) => ({ ...c, stock: e.target.value === '' ? 0 : Number(e.target.value) }))}
            />
            <p className='text-xs text-muted-foreground'>
              Si activás variantes, este stock se ignora y se usa el stock de cada variante.
            </p>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='simplePrice'>Price</Label>
            <Input
              id='simplePrice'
              type='number'
              min='0.01'
              step='0.01'
              value={form.simplePrice ?? ''}
              disabled={formBusy}
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
              disabled={formBusy}
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

