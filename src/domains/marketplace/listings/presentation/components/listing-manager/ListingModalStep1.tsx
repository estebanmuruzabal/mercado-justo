'use client'

import { useEffect, useState } from 'react'

import { listActiveProductBasesForSellerAction } from '@/domains/marketplace/listings/application/actions/listing-manager.actions'
import type { SellerProductBaseSummaryDto } from '@/domains/marketplace/product-base/application/dto/seller-product-base.dto'
import type { DraftFormState } from './types'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { DialogFooter } from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/utils/utils'
import { BadgeCheck } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

export function ListingModalStep1({
  form,
  formError,
  formBusy,
  deepestSelectedOk,
  byId,
  rootCategories,
  childrenByParent,
  categoryOptionsAtLevel,
  setCategoryAtLevel,
  listingTypeLabel,
  onProductBaseChange,
  onContinue,
}: {
  form: DraftFormState
  formError: string | null
  formBusy: boolean
  deepestSelectedOk: boolean
  byId: Map<string, { name?: string | null }>
  rootCategories: Array<{ id: string }>
  childrenByParent: Map<string, Array<{ id: string }>>
  categoryOptionsAtLevel: (level: number) => Array<{ id: string; name: string }>
  setCategoryAtLevel: (level: number, categoryId: string) => void
  listingTypeLabel: (listingType: DraftFormState['listingType']) => string
  onProductBaseChange: (productBaseId: string) => void
  onContinue: () => void
}) {
  const [productBases, setProductBases] = useState<SellerProductBaseSummaryDto[]>([])
  const [basesLoading, setBasesLoading] = useState(false)
  const [basesError, setBasesError] = useState<string | null>(null)
  const rootCategoryId = form.categoryPath[0] ?? null
  const subcategoryId = form.categoryPath.length > 1 ? form.categoryPath[form.categoryPath.length - 1] : null

  useEffect(() => {
    if (!deepestSelectedOk || !rootCategoryId) {
      setProductBases([])
      return
    }

    void (async () => {
      setBasesLoading(true)
      setBasesError(null)
      try {
        const rows = await listActiveProductBasesForSellerAction({
          categoryId: rootCategoryId,
          subcategoryId,
        })
        setProductBases(rows)
      } catch (err) {
        setBasesError(err instanceof Error ? err.message : 'No se pudieron cargar plantillas.')
        setProductBases([])
      } finally {
        setBasesLoading(false)
      }
    })()
  }, [deepestSelectedOk, rootCategoryId, subcategoryId])

  return (
    <div className='space-y-5'>
      <div className='space-y-1'>
        <Label>Step 1 — Listing type & Category selection</Label>
        <p className='text-sm text-muted-foreground'>
          Primero elegí el tipo. Luego seleccioná la categoría más profunda para continuar.
        </p>
      </div>

      {form.listingType ? (
        <div className='space-y-2'>
          <Label>Listing type</Label>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='secondary'>{listingTypeLabel(form.listingType)}</Badge>
          </div>
        </div>
      ) : null}

      {form.listingType ? (
        <div className='space-y-3'>
          {(() => {
            // Infinite nesting via dynamic depth.
            const memo = new Map<string, number>()
            const depth = (id: string): number => {
              if (memo.has(id)) return memo.get(id) as number
              const children = childrenByParent.get(id) ?? []
              const d = children.length === 0 ? 1 : 1 + Math.max(...children.map((c) => depth(c.id)))
              memo.set(id, d)
              return d
            }

            const maxDepth = rootCategories.length ? Math.max(...rootCategories.map((r) => depth(r.id))) : 0
            const levels = Array.from({ length: Math.max(maxDepth, 1) }).map((_, i) => i)

            return levels.map((level) => {
              const options = categoryOptionsAtLevel(level)
              const value = form.categoryPath[level] ?? ''
              const show = level === 0 || Boolean(form.categoryPath[level - 1])
              if (!show || options.length === 0) return null

              return (
                <div key={level} className='space-y-2'>
                  <Label>{level === 0 ? 'Root category' : `Level ${level + 1}`}</Label>
                  <select
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
                    value={value}
                    onChange={(e) => setCategoryAtLevel(level, e.target.value)}
                  >
                    <option value='' disabled>
                      Elegí…
                    </option>
                    {options.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })
          })()}
        </div>
      ) : null}

      <Separator />

      {form.categoryId ? (
        <div className='flex items-center justify-between gap-4'>
          <div className='space-y-1'>
            <p className='text-sm font-medium'>Selected category</p>
            <p className='text-sm text-muted-foreground'>
              {form.categoryPath.map((id) => byId.get(id)?.name ?? id).join(' → ') || '—'}
            </p>
          </div>
          <BadgeCheck className={cn('size-5', deepestSelectedOk ? 'text-green-600' : 'text-muted-foreground')} />
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>Elegí una categoría para continuar.</p>
      )}

      {deepestSelectedOk ? (
        <div className='space-y-2'>
          <Label>Plantilla (Product Base)</Label>
          <Select
            value={form.productBaseId ?? undefined}
            disabled={formBusy || basesLoading || productBases.length === 0}
            onValueChange={onProductBaseChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={basesLoading ? 'Cargando plantillas…' : 'Seleccionar plantilla'} />
            </SelectTrigger>
            <SelectContent>
              {productBases.map((base) => (
                <SelectItem key={base.id} value={base.id}>
                  {base.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {basesError ? <p className='text-sm text-destructive'>{basesError}</p> : null}
          {!basesLoading && productBases.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No hay plantillas activas para esta categoría.</p>
          ) : null}
        </div>
      ) : null}

      {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

      <DialogFooter className='pt-2'>
        <Button
          type='button'
          disabled={!form.listingType || !deepestSelectedOk || !form.productBaseId || formBusy}
          onClick={() => onContinue()}
        >
          {formBusy ? 'Creando borrador…' : 'Continuar'}
        </Button>
      </DialogFooter>
    </div>
  )
}

