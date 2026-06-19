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
import { ListingSection, type ListingSectionStatus } from './listing-section'

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return !Number.isNaN(value)
  if (typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
  return Boolean(value)
}

function getLegacyAttributeStatus(template: TemplateDef, form: DraftFormState): ListingSectionStatus {
  const missing = template.sections
    .flatMap((section) => section.fields)
    .filter((field) => {
      if (!field.required) return false
      const value =
        field.key === 'title'
          ? form.title
          : field.key === 'description'
            ? form.description
            : field.key === 'condition'
              ? form.condition
              : field.key === 'stock'
                ? form.stock
                : form.characteristics[field.key]
      return !hasValue(value)
    }).length
  return missing > 0 ? 'incomplete' : 'complete'
}

function getProductBaseAttributeStatus(form: DraftFormState): ListingSectionStatus {
  if (!form.productBase) return 'complete'
  const missing = form.productBase.attributes.filter(
    (attr) =>
      attr.isVisible &&
      !attr.isVariantDimension &&
      attr.required &&
      !hasValue(form.characteristics[attr.key] ?? attr.defaultValue),
  ).length
  if (missing > 0) return 'incomplete'
  return 'complete'
}

function getMediaStatus(form: DraftFormState): ListingSectionStatus {
  if (!form.productBase) return 'complete'
  const baseImageUrl = form.productBase.baseImageUrl?.trim() || null
  const hasListingImages = form.images.length > 0 || form.pendingListingImages.length > 0
  const hasBaseImage = Boolean(baseImageUrl)

  if (form.productBase.imageStrategy === 'LISTING_REQUIRED' && !hasListingImages) return 'error'
  if (form.productBase.imageStrategy === 'BASE_ONLY' && !hasBaseImage) return 'error'
  if (form.productBase.imageStrategy === 'BASE_OR_LISTING' && !hasListingImages && !hasBaseImage) return 'incomplete'
  return 'complete'
}

function getLocationStatus(form: DraftFormState): ListingSectionStatus {
  if (form.listingType !== 'product' && form.listingType !== 'dittobot') return 'complete'
  if (form.latitude === null || form.longitude === null) return 'incomplete'
  return 'complete'
}

function getCommerceStatus(form: DraftFormState): ListingSectionStatus {
  if (form.simplePrice == null || Number.isNaN(form.simplePrice) || form.simplePrice <= 0) return 'error'
  if (form.stock < 0) return 'error'
  return 'complete'
}

function getVariantStatus(variants: VariantEditorValue[]): ListingSectionStatus {
  if (variants.length === 0) return 'error'
  const hasErrors = variants.some((variant) => !variant.sku.trim() || variant.price <= 0 || variant.stock < 0)
  if (hasErrors) return 'incomplete'
  return 'complete'
}

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
  onPendingImagesChange,
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
  onPendingImagesChange: (pendingImages: DraftFormState['pendingListingImages']) => void
}) {
  const canEditListingLocation = form.listingType === 'product' || form.listingType === 'dittobot'
  const baseImageUrl = form.productBase?.baseImageUrl?.trim() || null
  const hasBaseImage = Boolean(baseImageUrl)
  const canUploadListingImages =
    form.productBase?.imageStrategy === 'LISTING_REQUIRED' ||
    form.productBase?.imageStrategy === 'BASE_OR_LISTING'
  const hasProductBase = Boolean(form.productBase)
  const legacyAttributesStatus = getLegacyAttributeStatus(template, form)
  const productBaseAttributesStatus = getProductBaseAttributeStatus(form)
  const mediaStatus = getMediaStatus(form)
  const locationStatus = getLocationStatus(form)
  const commerceStatus = hasProductBase
    ? form.enableVariants
      ? getVariantStatus(variants)
      : getCommerceStatus(form)
    : getCommerceStatus(form)

  return (
    <div className='space-y-5'>
      <div className='space-y-1'>
        <Label>Step 2 — Basic Information</Label>
        <p className='text-sm text-muted-foreground'>Completá la info básica y elegí si este producto tiene variantes.</p>
      </div>

      <div className='max-h-[calc(90vh-13rem)] space-y-3 overflow-y-auto pr-1'>
        <ListingSection
          title='Resumen'
          description='Título y configuración general de la publicación.'
          status={hasProductBase ? 'complete' : legacyAttributesStatus}
          defaultOpen
        >
          {hasProductBase ? (
            <div className='space-y-2 rounded-xl border bg-background p-4'>
              <Label>Title</Label>
              <p className='text-sm font-semibold'>{form.productBase?.name}</p>
              <p className='text-xs text-muted-foreground'>
                El título del listing se toma del nombre del Product Base y no se puede modificar.
              </p>
            </div>
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
        </ListingSection>

        {canEditListingLocation ? (
          <ListingSection
            title='Ubicación'
            description='Definí dónde se entrega o publica el listing.'
            status={locationStatus}
            defaultOpen={locationStatus !== 'complete'}
          >
            <ListingLocationPicker
              value={{ latitude: form.latitude, longitude: form.longitude }}
              sellerLocation={sellerLocation}
              disabled={formBusy}
              onChange={(next) => setForm((c) => ({ ...c, latitude: next.latitude, longitude: next.longitude }))}
            />
          </ListingSection>
        ) : null}

        {(hasBaseImage || canUploadListingImages) ? (
          <ListingSection
            title='Imágenes'
            description={
              hasBaseImage && canUploadListingImages
                ? 'La imagen base del Product Base se muestra como preview y además podés subir imágenes del listing.'
                : hasBaseImage
                  ? 'La imagen base del Product Base se muestra como preview.'
                  : 'Subí imágenes del listing o reutilizá las que ya tenés.'
            }
            status={mediaStatus}
            defaultOpen={mediaStatus !== 'complete'}
          >
            <div className='space-y-4'>
              {hasBaseImage ? (
                <div className='space-y-2 rounded-xl border bg-background p-4'>
                  <Label>Imagen base del Product Base</Label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={baseImageUrl!} alt={form.productBase?.name || 'Imagen base'} className='h-40 w-full rounded-md object-cover' />
                </div>
              ) : null}

              {canUploadListingImages ? (
                <ListingImagesEditor
                  listingId={form.listingId}
                  images={form.images}
                  pendingImages={form.pendingListingImages}
                  required={form.productBase?.imageStrategy === 'LISTING_REQUIRED'}
                  disabled={formBusy}
                  onChange={(images) => setForm((current) => ({ ...current, images }))}
                  onPendingImagesChange={onPendingImagesChange}
                />
              ) : null}
            </div>
          </ListingSection>
        ) : null}

        {hasProductBase ? (
          <ListingSection
            title='Atributos'
            description='Completá los atributos visibles del Product Base.'
            status={productBaseAttributesStatus}
            defaultOpen={productBaseAttributesStatus !== 'complete'}
          >
            <ProductBaseAttributeFields
              productBase={form.productBase!}
              values={form.characteristics}
              disabled={formBusy}
              onChange={(characteristics) => setForm((current) => ({ ...current, characteristics }))}
            />
          </ListingSection>
        ) : null}

        {hasProductBase ? (
          <ListingSection
            title='Variantes y stock'
            description={form.enableVariants ? 'Cada variante define su propio precio y stock.' : 'Stock y precio simples.'}
            status={commerceStatus}
            defaultOpen={commerceStatus !== 'complete'}
          >
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
              ) : (
                <div className='space-y-4'>
                  <div className='space-y-2'>
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

                  <div className='space-y-2'>
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

                  <div className='space-y-2'>
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
              )}
            </div>
          </ListingSection>
        ) : null}
      </div>

      {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

      <DialogFooter className='pt-2'>
        <div className='flex w-full items-center justify-between gap-2'>
          <Button type='button' variant='outline' disabled={formBusy} onClick={onBack}>
            Back
          </Button>

          <Button
            type='button'
            disabled={formBusy || (form.simplePrice == null && !form.enableVariants && !hasProductBase)}
            onClick={() => onNext()}
          >
            {formBusy ? 'Guardando…' : 'Next: Review'}
          </Button>
        </div>
      </DialogFooter>
    </div>
  )
}

