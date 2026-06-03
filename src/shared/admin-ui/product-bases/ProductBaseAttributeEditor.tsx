'use client'

import { Plus, Trash2 } from 'lucide-react'

import type { ProductBaseAttributeDto } from '@/domains/marketplace/product-base/application/dto/product-base.dto'
import { PRODUCT_BASE_ATTRIBUTE_TYPES } from '@/domains/marketplace/product-base/domain/product-base-attribute'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'

function attributeRowKey(attr: ProductBaseAttributeDto, index: number): string {
  return attr.clientKey ?? attr.id ?? `row-${index}`
}

export function createEmptyAttribute(sortOrder: number): ProductBaseAttributeDto {
  return {
    clientKey: crypto.randomUUID(),
    key: '',
    label: '',
    type: 'TEXT',
    required: false,
    sortOrder,
    isVisible: true,
    isFilterable: false,
    isSearchable: false,
    isVariantDimension: false,
    allowVariantPricing: false,
  }
}

export function ProductBaseAttributeEditor({
  attributes,
  onChange,
}: {
  attributes: ProductBaseAttributeDto[]
  onChange: (next: ProductBaseAttributeDto[]) => void
}) {
  const variantDimensionIndex = attributes.findIndex((attr) => attr.isVariantDimension)

  function updateAttribute(index: number, patch: Partial<ProductBaseAttributeDto>) {
    onChange(
      attributes.map((attr, i) => (i === index ? { ...attr, ...patch } : attr)),
    )
  }

  function removeAttribute(index: number) {
    onChange(
      attributes
        .filter((_, i) => i !== index)
        .map((attr, sortOrder) => ({ ...attr, sortOrder })),
    )
  }

  function addAttribute() {
    onChange([...attributes, createEmptyAttribute(attributes.length)])
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h3 className='text-sm font-semibold'>Atributos dinámicos</h3>
          <p className='text-xs text-muted-foreground'>
            Máximo un atributo con dimensión de variante por Product Base.
          </p>
        </div>
        <Button type='button' variant='outline' size='sm' onClick={addAttribute}>
          <Plus className='mr-2 h-4 w-4' />
          Agregar atributo
        </Button>
      </div>

      {attributes.length === 0 ? (
        <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
          Todavía no hay atributos definidos.
        </p>
      ) : null}

      {attributes.map((attr, index) => {
        const optionsText = (attr.options ?? []).join(', ')
        const canMarkVariant = variantDimensionIndex === -1 || variantDimensionIndex === index

        return (
          <div key={attributeRowKey(attr, index)} className='space-y-3 rounded-lg border p-4'>
            <div className='flex items-start justify-between gap-3'>
              <p className='text-sm font-medium'>Atributo #{index + 1}</p>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => removeAttribute(index)}
                aria-label='Eliminar atributo'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Key</Label>
                <Input
                  value={attr.key}
                  onChange={(e) => updateAttribute(index, { key: e.target.value })}
                  placeholder='tamano'
                />
              </div>
              <div className='space-y-2'>
                <Label>Label</Label>
                <Input
                  value={attr.label}
                  onChange={(e) => updateAttribute(index, { label: e.target.value })}
                  placeholder='Tamaño'
                />
              </div>
              <div className='space-y-2'>
                <Label>Tipo</Label>
                <Select
                  value={attr.type}
                  onValueChange={(value) =>
                    updateAttribute(index, {
                      type: value as ProductBaseAttributeDto['type'],
                      options: value === 'SELECT' || value === 'MULTISELECT' ? attr.options ?? [] : null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_BASE_ATTRIBUTE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Placeholder</Label>
                <Input
                  value={attr.placeholder ?? ''}
                  onChange={(e) => updateAttribute(index, { placeholder: e.target.value || null })}
                />
              </div>
            </div>

            {(attr.type === 'SELECT' || attr.type === 'MULTISELECT') && (
              <div className='space-y-2'>
                <Label>Opciones (separadas por coma)</Label>
                <Textarea
                  value={optionsText}
                  onChange={(e) =>
                    updateAttribute(index, {
                      options: e.target.value
                        .split(',')
                        .map((option) => option.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder='XS, S, M, L'
                />
              </div>
            )}

            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              <label className='flex items-center justify-between gap-2 text-sm'>
                Requerido
                <Switch
                  checked={attr.required}
                  onCheckedChange={(checked) => updateAttribute(index, { required: checked })}
                />
              </label>
              <label className='flex items-center justify-between gap-2 text-sm'>
                Visible
                <Switch
                  checked={attr.isVisible}
                  onCheckedChange={(checked) => updateAttribute(index, { isVisible: checked })}
                />
              </label>
              <label className='flex items-center justify-between gap-2 text-sm'>
                Filtrable
                <Switch
                  checked={attr.isFilterable}
                  onCheckedChange={(checked) => updateAttribute(index, { isFilterable: checked })}
                />
              </label>
              <label className='flex items-center justify-between gap-2 text-sm'>
                Buscable
                <Switch
                  checked={attr.isSearchable}
                  onCheckedChange={(checked) => updateAttribute(index, { isSearchable: checked })}
                />
              </label>
              <label className='flex items-center justify-between gap-2 text-sm'>
                Dimensión variante
                <Switch
                  checked={attr.isVariantDimension}
                  disabled={!canMarkVariant}
                  onCheckedChange={(checked) =>
                    updateAttribute(index, {
                      isVariantDimension: checked,
                      allowVariantPricing: checked ? attr.allowVariantPricing : false,
                    })
                  }
                />
              </label>
              <label className='flex items-center justify-between gap-2 text-sm'>
                Pricing por variante
                <Switch
                  checked={attr.allowVariantPricing}
                  disabled={!attr.isVariantDimension}
                  onCheckedChange={(checked) =>
                    updateAttribute(index, { allowVariantPricing: checked })
                  }
                />
              </label>
            </div>
          </div>
        )
      })}
    </div>
  )
}
