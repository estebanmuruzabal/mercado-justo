'use client'

import type { DraftFormState } from './types'
import type { VariantEditorValue } from '@/domains/marketplace/listings/presentation/components/variants/VariantCard'

import { Upload } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { DialogFooter } from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { createLogger } from '@/shared/lib/logger/logger'
import { ListingSection, type ListingSectionStatus } from './listing-section'

const logListingReview = createLogger('listingManager.review')

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return !Number.isNaN(value)
  if (typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
  return Boolean(value)
}

function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.length ? value.map(formatAttributeValue).join(', ') : '—'
  return JSON.stringify(value)
}

export function ListingModalReview({
  form,
  variants,
  byId,
  formBusy,
  formError,
  onBack,
  onSaveDraft,
  onPublish,
}: {
  form: DraftFormState
  variants: VariantEditorValue[]
  byId: Map<string, { name?: string | null }>
  formBusy: boolean
  formError: string | null
  onBack: () => void
  onSaveDraft: () => void
  onPublish: () => void
}) {
  const reviewImage = form.images[0] ?? form.productBase?.baseImageUrl?.trim() ?? ''
  const hasReviewImage = Boolean(reviewImage)
  const reviewTitle = form.productBase?.name ?? form.title
  const productBaseAttributes = form.productBase?.attributes ?? []
  const categoryStatus: ListingSectionStatus = form.categoryId ? 'complete' : 'incomplete'
  const mediaStatus: ListingSectionStatus = form.productBase
    ? form.productBase.imageStrategy === 'LISTING_REQUIRED' && form.images.length === 0
      ? 'error'
      : form.productBase.imageStrategy === 'BASE_ONLY' && !reviewImage
        ? 'error'
        : form.productBase.imageStrategy === 'BASE_OR_LISTING' && !reviewImage
        ? 'incomplete'
        : 'complete'
    : hasReviewImage
      ? 'complete'
      : 'incomplete'
  const attributesStatus: ListingSectionStatus = form.productBase
    ? productBaseAttributes.every((attr) => !attr.required || hasValue(form.characteristics[attr.key] ?? attr.defaultValue))
      ? 'complete'
      : 'incomplete'
    : Object.keys(form.characteristics).length > 0
      ? 'complete'
      : 'incomplete'
  const commerceStatus: ListingSectionStatus = form.enableVariants
    ? variants.length === 0
      ? 'error'
      : variants.some((v) => !v.sku.trim() || v.price <= 0 || v.stock < 0)
        ? 'incomplete'
        : 'complete'
    : form.simplePrice == null || form.simplePrice <= 0
      ? 'error'
      : 'complete'
  logListingReview.trace('review step rendered', {
    reviewTitle,
    hasReviewImage,
    attributeCount: productBaseAttributes.length,
  })
  return (
    <div className='space-y-5'>
      <div className='space-y-1'>
        <Label>Step 3 — Review & Publish</Label>
        <p className='text-sm text-muted-foreground'>Revisá todo y elegí si guardás como borrador o publicás.</p>
      </div>

      <div className='max-h-[calc(90vh-13rem)] space-y-3 overflow-y-auto pr-1'>
        <ListingSection title='Resumen' description='Categoría, título y descripción.' status={categoryStatus} defaultOpen>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Category</Label>
              <p className='text-sm text-muted-foreground'>
                {form.categoryPath.map((id) => byId.get(id)?.name ?? id).join(' → ') ||
                  byId.get(form.categoryId ?? '')?.name ||
                  '—'}
              </p>
            </div>

            <div className='space-y-1'>
              <Label>Title</Label>
              <p className='text-sm font-semibold'>{reviewTitle || '—'}</p>
            </div>

            <div className='space-y-1'>
              <Label>Description</Label>
              <p className='text-sm text-muted-foreground'>{form.description || '—'}</p>
            </div>
          </div>
        </ListingSection>

        <ListingSection title='Media' description='Preview e imágenes asociadas.' status={mediaStatus} defaultOpen={mediaStatus !== 'complete'}>
          <div className='space-y-3'>
            {hasReviewImage ? (
              <div className='space-y-2'>
                <Label>Preview</Label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={reviewImage} alt={reviewTitle || 'preview'} className='h-40 w-full rounded-md object-cover' />
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>No hay imagen principal para mostrar.</p>
            )}
          </div>
        </ListingSection>

        <ListingSection
          title='Atributos'
          description='Valores que se publicarán para esta pieza.'
          status={attributesStatus}
          defaultOpen={attributesStatus !== 'complete'}
        >
          <div className='space-y-2'>
            {productBaseAttributes.length > 0 ? (
              <div className='grid gap-2 sm:grid-cols-2'>
                {productBaseAttributes.map((attr) => (
                  <div key={attr.id} className='rounded-md border bg-muted/10 px-3 py-2'>
                    <p className='text-xs font-medium text-foreground'>{attr.label}</p>
                    <p className='break-words text-sm text-muted-foreground'>
                      {formatAttributeValue(form.characteristics[attr.key] ?? attr.defaultValue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-wrap gap-2'>
                {Object.entries(form.characteristics).map(([k, v]) => (
                  <span key={k} className='rounded-md border bg-muted/10 px-2 py-1 text-xs text-muted-foreground'>
                    {k}: {formatAttributeValue(v)}
                  </span>
                ))}

                {Object.keys(form.characteristics).length === 0 ? (
                  <span className='text-sm text-muted-foreground'>—</span>
                ) : null}
              </div>
            )}
          </div>
        </ListingSection>

        <ListingSection
          title='Comercialización'
          description='Variante única o catálogo con variantes.'
          status={commerceStatus}
          defaultOpen={commerceStatus !== 'complete'}
        >
          {form.enableVariants ? (
            <div className='space-y-2'>
              <Label>Variants</Label>
              <div className='space-y-2'>
                {variants.length === 0 ? (
                  <p className='text-sm text-destructive'>Necesitás al menos 1 variante.</p>
                ) : (
                  variants.map((v, idx) => (
                    <div key={v.id ?? `${v.sku}-${idx}`} className='rounded-lg border bg-muted/10 p-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='space-y-0.5'>
                          <p className='text-sm font-semibold'>{v.name}</p>
                          <p className='text-xs text-muted-foreground'>Price: ${v.price}</p>
                          <p className='text-xs text-muted-foreground'>Stock: {v.stock}</p>
                        </div>
                        {v.isDefault ? <span className='text-xs text-muted-foreground'>(default)</span> : null}
                      </div>

                      <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1'>
                        {Object.entries(v.attributes ?? {})
                          .slice(0, 6)
                          .map(([k, val]) => (
                            <span key={k} className='text-xs text-muted-foreground'>
                              {k}: {val}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className='text-sm text-muted-foreground'>Total stock: {variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)}</div>
            </div>
          ) : (
            <div className='space-y-2'>
              <Label>Simple listing</Label>
              <div className='grid gap-2 sm:grid-cols-2'>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>Stock</p>
                  <p className='text-sm font-semibold'>{form.stock}</p>
                </div>

                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>Price</p>
                  <p className='text-sm font-semibold'>{form.simplePrice ?? '—'}</p>
                </div>
              </div>

              {form.simpleSku ? <div className='text-sm text-muted-foreground'>SKU: {form.simpleSku}</div> : null}
            </div>
          )}
        </ListingSection>
      </div>

      {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

      <DialogFooter className='pt-2'>
        <div className='flex w-full items-center justify-between gap-2'>
          <Button type='button' variant='outline' disabled={formBusy} onClick={onBack}>
            Back
          </Button>

          <div className='flex gap-2'>
            <Button type='button' variant='secondary' disabled={formBusy} onClick={() => onSaveDraft()}>
              Save Draft
            </Button>

            <Button
              type='button'
              variant='default'
              disabled={formBusy || !form.listingId}
              onClick={() => onPublish()}
            >
              <Upload className='mr-2 size-4' />
              {form.status === 'draft' ? 'Publish' : 'Update & Publish'}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </div>
  )
}

