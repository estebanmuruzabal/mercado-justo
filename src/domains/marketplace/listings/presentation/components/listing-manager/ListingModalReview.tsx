'use client'

import type { DraftFormState } from './types'
import type { VariantEditorValue } from '@/domains/marketplace/listings/presentation/components/variants/VariantCard'

import { Upload } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { DialogFooter } from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'

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
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0]
  const imageFromVariant = typeof defaultVariant?.attributes?.['image'] === 'string' ? defaultVariant.attributes['image'] : null
  const imageFromLegacy = typeof form.characteristics?.['image'] === 'string' ? form.characteristics['image'] : null
  const reviewImage = imageFromVariant ?? imageFromLegacy
  const reviewTitle = form.productBase?.name ?? form.title
  const productBaseAttributes = form.productBase?.attributes ?? []
console.log('reviewImage', form)
  return (
    <div className='space-y-5'>
      <div className='space-y-1'>
        <Label>Step 3 — Review & Publish</Label>
        <p className='text-sm text-muted-foreground'>Revisá todo y elegí si guardás como borrador o publicás.</p>
      </div>

      <div className='space-y-3 rounded-xl border bg-background p-4'>
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

        {reviewImage ? (
          <div className='space-y-2'>
            <Label>Preview</Label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reviewImage} alt={reviewTitle || 'preview'} className='h-40 w-full rounded-md object-cover' />
          </div>
        ) : null}

        <div className='space-y-1'>
          <Label>Description</Label>
          <p className='text-sm text-muted-foreground'>{form.description || '—'}</p>
        </div>

        <div className='space-y-2'>
          <Label>Characteristics</Label>
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

              {Object.keys(form.characteristics).length === 0 ? <span className='text-sm text-muted-foreground'>—</span> : null}
            </div>
          )}
        </div>

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
                        <p className='text-sm font-semibold'>{v.sku || '(Sin SKU)'}</p>
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

