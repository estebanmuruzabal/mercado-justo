'use client'

import { Button } from '@/components/ui/button'

export type VariantAttributeValue = string

export type VariantEditorValue = {
  clientId: string
  id?: string
  name: string
  sku: string
  price: number
  stock: number
  isDefault: boolean
  attributes: Record<string, VariantAttributeValue>
}

export function VariantCard({
  variant,
  selected,
  onSelect,
  onDelete,
}: {
  variant: VariantEditorValue
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const attrEntries = Object.entries(variant.attributes)

  return (
    <div
      className={`rounded-xl border p-3 ${selected ? 'ring-2 ring-ring' : 'bg-background'}`}
      role='button'
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect()
      }}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <div className='truncate text-sm font-semibold'>{variant.name || variant.sku || '(Sin nombre)'}</div>
            {variant.isDefault ? <span className='text-xs text-muted-foreground'>(default)</span> : null}
          </div>
          <div className='mt-1 text-xs text-muted-foreground'>Stock: {variant.stock}</div>
          <div className='text-xs text-muted-foreground'>Price: ${variant.price}</div>
        </div>

        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label='Delete variant'
        >
          <span aria-hidden='true'>X</span>
        </Button>
      </div>

      {attrEntries.length ? (
        <div className='mt-3 space-y-1'>
          {attrEntries.slice(0, 6).map(([k, v]) => (
            <div key={k} className='text-sm text-muted-foreground'>
              <span className='font-medium text-foreground'>{k}</span>: {v}
            </div>
          ))}
          {attrEntries.length > 6 ? <div className='text-xs text-muted-foreground'>…</div> : null}
        </div>
      ) : (
        <div className='mt-3 text-xs text-muted-foreground'>Sin atributos</div>
      )}
    </div>
  )
}

