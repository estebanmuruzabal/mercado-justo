'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { VariantAttributeEditor } from './VariantAttributeEditor'
import { VariantCard, type VariantEditorValue } from './VariantCard'

function createClientId() {
  return `v_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

function makeEmptyVariant(): VariantEditorValue {
  return {
    clientId: createClientId(),
    name: 'Variant',
    sku: '',
    price: 0.01,
    stock: 0,
    isDefault: true,
    attributes: {},
  }
}

export function VariantEditor({
  variants,
  onChange,
}: {
  variants: VariantEditorValue[]
  onChange: (next: VariantEditorValue[]) => void
}) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  useEffect(() => {
    if (variants.length === 0) {
      setSelectedClientId(null)
      return
    }
    if (selectedClientId && variants.some((v) => v.clientId === selectedClientId)) return

    const first = variants.find((v) => v.isDefault) ?? variants[0]
    setSelectedClientId(first?.clientId ?? null)
  }, [variants, selectedClientId])

  const selectedVariant = useMemo(() => {
    if (!selectedClientId) return null
    return variants.find((v) => v.clientId === selectedClientId) ?? null
  }, [variants, selectedClientId])

  function setVariant(next: VariantEditorValue) {
    const key = selectedVariant?.clientId
    if (!key) return
    onChange(
      variants.map((v) => {
        if (v.clientId !== key) return v
        return next
      })
    )
  }

  function ensureSingleDefault(nextVariants: VariantEditorValue[], defaultIndex: number) {
    return nextVariants.map((v, idx) => ({
      ...v,
      isDefault: idx === defaultIndex,
    }))
  }

  const defaultIndex = variants.findIndex((v) => v.isDefault)

  return (
    <div className='space-y-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <Label>Variants</Label>
          <p className='text-sm text-muted-foreground'>Agregá variantes comprables con atributos dinámicos.</p>
        </div>
        <Button
          type='button'
          variant='secondary'
          onClick={() => {
            const empty = makeEmptyVariant()
            const next = variants.length === 0
              ? [empty]
              : [...variants.map((v) => ({ ...v, isDefault: false })), { ...empty, isDefault: true }]
            onChange(next)
            setSelectedClientId(empty.clientId)
          }}
        >
          Add variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <p className='text-sm text-muted-foreground'>No variants yet.</p>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2'>
          {variants.map((v) => {
            const key = v.clientId
            return (
              <VariantCard
                key={key}
                variant={v}
                selected={v.isDefault || selectedVariant?.clientId === v.clientId}
                onSelect={() => setSelectedClientId(v.clientId)}
                onDelete={() => {
                  const next = variants.filter((x) => x.clientId !== v.clientId)
                  if (next.length === 0) return onChange([])
                  const idxInOld = variants.findIndex((x) => x.clientId === v.clientId)
                  const nextDefaultIdx = Math.max(0, Math.min(defaultIndex === -1 ? 0 : idxInOld, next.length - 1))
                  onChange(ensureSingleDefault(next, nextDefaultIdx))
                }}
              />
            )
          })}
        </div>
      )}

      {selectedVariant ? (
        <div className='space-y-4 rounded-xl border bg-muted/10 p-4'>
          <div className='flex items-center justify-between gap-3'>
            <Label>Editor</Label>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={selectedVariant.isDefault}
                onChange={(e) => {
                  if (!e.target.checked) {
                    setVariant({ ...selectedVariant, isDefault: false })
                    return
                  }
                  const idx = variants.findIndex((x) => x.clientId === selectedVariant.clientId)
                  onChange(ensureSingleDefault(variants, idx))
                }}
              />
              <span className='text-sm text-muted-foreground'>Default</span>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-1'>
              <Label htmlFor='variantName'>Variant name</Label>
              <Input
                id='variantName'
                value={selectedVariant.name}
                onChange={(e) => setVariant({ ...selectedVariant, name: e.target.value })}
                placeholder='e.g. Negro XL'
              />
            </div>

            <div className='space-y-1'>
              <Label htmlFor='sku'>SKU</Label>
              <Input
                id='sku'
                value={selectedVariant.sku}
                onChange={(e) => setVariant({ ...selectedVariant, sku: e.target.value })}
                placeholder='e.g. rem-nero-m'
              />
            </div>

            <div className='space-y-1'>
              <Label htmlFor='price'>Price</Label>
              <Input
                id='price'
                type='number'
                step='0.01'
                min='0'
                value={selectedVariant.price}
                onChange={(e) => setVariant({ ...selectedVariant, price: Number(e.target.value) })}
              />
            </div>

            <div className='space-y-1'>
              <Label htmlFor='stock'>Stock</Label>
              <Input
                id='stock'
                type='number'
                min='0'
                step='1'
                value={selectedVariant.stock}
                onChange={(e) => setVariant({ ...selectedVariant, stock: Number(e.target.value) })}
              />
            </div>
          </div>

          <VariantAttributeEditor
            attributes={selectedVariant.attributes}
            onChange={(next) => setVariant({ ...selectedVariant, attributes: next })}
          />
        </div>
      ) : null}
    </div>
  )
}

