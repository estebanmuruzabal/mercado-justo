'use client'

import type { SellerProductBaseDetailDto } from '@/domains/marketplace/product-base/application/dto/seller-product-base.dto'
import type { CharacteristicMap, CharacteristicValue } from '@/domains/marketplace/listings/domain/product'

import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

export function ProductBaseAttributeFields({
  productBase,
  values,
  onChange,
  disabled,
}: {
  productBase: SellerProductBaseDetailDto
  values: CharacteristicMap
  onChange: (next: CharacteristicMap) => void
  disabled?: boolean
}) {
  const attributes = productBase.attributes.filter((attr) => attr.isVisible && !attr.isVariantDimension)

  if (attributes.length === 0) {
    return (
      <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
        Esta plantilla no tiene atributos visibles para completar.
      </p>
    )
  }

  function setValue(key: string, value: CharacteristicValue) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <Label>Atributos de la plantilla</Label>
        <p className='text-sm text-muted-foreground'>
          Completá los atributos definidos en Product Base para esta publicación.
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        {attributes.map((attribute) => {
          const id = `product-base-attribute-${attribute.key}`
          const value = values[attribute.key]

          if (attribute.type === 'TEXTAREA') {
            return (
              <div key={attribute.id} className='space-y-2 sm:col-span-2'>
                <Label htmlFor={id}>
                  {attribute.label}
                  {attribute.required ? ' *' : ''}
                </Label>
                <Textarea
                  id={id}
                  value={typeof value === 'string' ? value : ''}
                  placeholder={attribute.placeholder ?? undefined}
                  disabled={disabled}
                  onChange={(e) => setValue(attribute.key, e.target.value)}
                />
              </div>
            )
          }

          if (attribute.type === 'NUMBER' || attribute.type === 'CURRENCY' || attribute.type === 'PERCENTAGE') {
            return (
              <div key={attribute.id} className='space-y-2'>
                <Label htmlFor={id}>
                  {attribute.label}
                  {attribute.required ? ' *' : ''}
                </Label>
                <Input
                  id={id}
                  type='number'
                  step={attribute.type === 'NUMBER' ? attribute.validation?.step ?? 'any' : '0.01'}
                  min={attribute.validation?.min}
                  max={attribute.validation?.max}
                  value={typeof value === 'number' ? value : ''}
                  placeholder={attribute.placeholder ?? undefined}
                  disabled={disabled}
                  onChange={(e) => setValue(attribute.key, e.target.value === '' ? null : Number(e.target.value))}
                />
              </div>
            )
          }

          if (attribute.type === 'BOOLEAN') {
            return (
              <label key={attribute.id} className='flex items-center justify-between gap-3 rounded-lg border p-3 text-sm'>
                <span>
                  {attribute.label}
                  {attribute.required ? ' *' : ''}
                </span>
                <Switch
                  checked={Boolean(value)}
                  disabled={disabled}
                  onCheckedChange={(checked) => setValue(attribute.key, checked)}
                />
              </label>
            )
          }

          if (attribute.type === 'DATE') {
            return (
              <div key={attribute.id} className='space-y-2'>
                <Label htmlFor={id}>
                  {attribute.label}
                  {attribute.required ? ' *' : ''}
                </Label>
                <Input
                  id={id}
                  type='date'
                  value={typeof value === 'string' ? value : ''}
                  disabled={disabled}
                  onChange={(e) => setValue(attribute.key, e.target.value)}
                />
              </div>
            )
          }

          if (attribute.type === 'SELECT') {
            return (
              <div key={attribute.id} className='space-y-2'>
                <Label>
                  {attribute.label}
                  {attribute.required ? ' *' : ''}
                </Label>
                <Select
                  value={typeof value === 'string' ? value : undefined}
                  disabled={disabled}
                  onValueChange={(next) => setValue(attribute.key, next)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={attribute.placeholder ?? 'Seleccionar…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(attribute.options ?? []).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }

          if (attribute.type === 'MULTISELECT') {
            const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
            return (
              <div key={attribute.id} className='space-y-2 sm:col-span-2'>
                <Label>
                  {attribute.label}
                  {attribute.required ? ' *' : ''}
                </Label>
                <div className='flex flex-wrap gap-2'>
                  {(attribute.options ?? []).map((option) => {
                    const active = selected.includes(option)
                    return (
                      <button
                        key={option}
                        type='button'
                        disabled={disabled}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          active ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                        onClick={() =>
                          setValue(
                            attribute.key,
                            active ? selected.filter((item) => item !== option) : [...selected, option],
                          )
                        }
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          }

          return (
            <div key={attribute.id} className='space-y-2'>
              <Label htmlFor={id}>
                {attribute.label}
                {attribute.required ? ' *' : ''}
              </Label>
              <Input
                id={id}
                type={attribute.type === 'EMAIL' ? 'email' : attribute.type === 'URL' ? 'url' : attribute.type === 'PHONE' ? 'tel' : 'text'}
                value={typeof value === 'string' ? value : ''}
                placeholder={attribute.placeholder ?? undefined}
                disabled={disabled}
                onChange={(e) => setValue(attribute.key, e.target.value)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
