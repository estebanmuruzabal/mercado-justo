'use client'

import type { Dispatch, SetStateAction } from 'react'

import type { TemplateDef } from '@/domains/marketplace/listings/domain/product'
import type { DraftFormState } from './types'

import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Skeleton } from '@/shared/ui/skeleton'
import { VariantEditor } from '@/domains/marketplace/listings/presentation/components/variants/VariantEditor'
import type { VariantEditorValue } from '@/domains/marketplace/listings/presentation/components/variants/VariantCard'

export function ListingModalCharacteristicFields({
  template,
  form,
  setForm,
  variants,
  variantsLoading,
  setVariants,
}: {
  template: TemplateDef
  form: DraftFormState
  setForm: Dispatch<SetStateAction<DraftFormState>>
  variants: VariantEditorValue[]
  variantsLoading: boolean
  setVariants: Dispatch<SetStateAction<VariantEditorValue[]>>
}) {
  const sections = template.sections

  let didRenderToggle = false

  return (
    <div className='space-y-4'>
      {sections.map((section) => (
        <details key={section.title} className='rounded-lg border bg-muted/20 p-3'>
          <summary className='cursor-pointer text-sm font-medium text-foreground'>{section.title}</summary>

          <div className='mt-3 space-y-3'>
            {section.fields.map((field) => {
              if (field.key === 'stock' && form.enableVariants) return null

              const shouldRenderToggle = field.key === 'condition' && !didRenderToggle
              if (shouldRenderToggle) didRenderToggle = true

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

              const onChange = (val: string | number) => {
                if (field.key === 'title') return setForm((c) => ({ ...c, title: String(val) }))
                if (field.key === 'description') return setForm((c) => ({ ...c, description: String(val) }))
                if (field.key === 'condition') {
                  const next = String(val).toLowerCase()
                  const safe = next === 'used' ? 'used' : 'new'
                  return setForm((c) => ({ ...c, condition: safe }))
                }
                if (field.key === 'stock') return setForm((c) => ({ ...c, stock: Number(val) }))

                setForm((c) => ({
                  ...c,
                  characteristics: { ...c.characteristics, [field.key]: val },
                }))
              }

              return (
                <div key={field.key} className='space-y-2'>
                  <Label>{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className='min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
                      value={value == null ? '' : String(value)}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === 'number' ? (
                    <Input
                      type='number'
                      value={value == null ? '' : Number(value)}
                      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <Input
                      value={value == null ? '' : String(value)}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}

                  {shouldRenderToggle ? (
                    <div className='mt-2 space-y-2'>
                      <div className='flex items-center justify-between gap-4 rounded-xl border bg-muted/10 p-3'>
                        <div className='space-y-0.5'>
                          <Label>Enable variants</Label>
                          <p className='text-xs text-muted-foreground'>Si activás variantes, el precio/stock van por variante.</p>
                        </div>
                        <input
                          type='checkbox'
                          checked={form.enableVariants}
                          onChange={(e) => setForm((c) => ({ ...c, enableVariants: e.target.checked }))}
                          aria-label='Enable variants'
                        />
                      </div>

                      {form.enableVariants ? (
                        <div className='space-y-5'>
                          <div className='space-y-1'>
                            <Label>Variants</Label>
                            <p className='text-sm text-muted-foreground'>Agregá variantes comprables con atributos dinámicos.</p>
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
                  ) : null}
                </div>
              )
            })}
          </div>
        </details>
      ))}
    </div>
  )
}

