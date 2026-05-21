'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type AttributeRow = { id: string; key: string; value: string }

function toRows(attributes: Record<string, string>): AttributeRow[] {
  return Object.entries(attributes).map(([k, v], idx) => ({
    id: `${k}-${idx}`,
    key: k,
    value: typeof v === 'string' ? v : JSON.stringify(v),
  }))
}

function toAttributes(rows: AttributeRow[]): Record<string, string> {
  const next: Record<string, string> = {}
  for (const r of rows) {
    const k = r.key.trim()
    if (!k) continue
    next[k] = r.value
  }
  return next
}

export function VariantAttributeEditor({
  attributes,
  onChange,
}: {
  attributes: Record<string, string>
  onChange: (next: Record<string, string>) => void
}) {
  const rows = toRows(attributes)

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-2'>
        <Label>Attributes</Label>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => {
            const nextRows = [...rows, { id: `new-${rows.length}`, key: '', value: '' }]
            onChange(toAttributes(nextRows))
          }}
        >
          Add attribute
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className='text-sm text-muted-foreground'>No attributes yet.</p>
      ) : (
        <div className='space-y-3'>
          {rows.map((r, idx) => (
            <div key={r.id} className='grid grid-cols-[1fr_1fr_auto] items-end gap-2'>
              <div className='space-y-1'>
                <Label htmlFor={`attr-key-${idx}`}>Key</Label>
                <Input
                  id={`attr-key-${idx}`}
                  value={r.key}
                  onChange={(e) => {
                    const nextRows = rows.map((x) => (x.id === r.id ? { ...x, key: e.target.value } : x))
                    onChange(toAttributes(nextRows))
                  }}
                />
              </div>

              <div className='space-y-1'>
                <Label htmlFor={`attr-value-${idx}`}>Value</Label>
                <Input
                  id={`attr-value-${idx}`}
                  value={r.value}
                  onChange={(e) => {
                    const nextRows = rows.map((x) => (x.id === r.id ? { ...x, value: e.target.value } : x))
                    onChange(toAttributes(nextRows))
                  }}
                />
              </div>

              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => {
                  const nextRows = rows.filter((x) => x.id !== r.id)
                  onChange(toAttributes(nextRows))
                }}
                aria-label='Remove attribute'
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

