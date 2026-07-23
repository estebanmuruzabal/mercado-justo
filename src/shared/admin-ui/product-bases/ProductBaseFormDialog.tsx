'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BadgeCheck, Loader2 } from 'lucide-react'

import type { AdminCategoryRow } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import {
  createProductBaseAction,
  updateProductBaseAction,
} from '@/domains/marketplace/product-base/application/actions/admin-product-base.actions'
import type {
  ProductBaseDetailDto,
  ProductBaseFormDto,
} from '@/domains/marketplace/product-base/application/dto/product-base.dto'
import {
  PRODUCT_BASE_IMAGE_STRATEGIES,
  PRODUCT_BASE_TYPES,
  slugifyProductBaseName,
} from '@/domains/marketplace/product-base/domain/product-base'
import { Button } from '@/shared/ui/button'
import { createLogger } from '@/shared/lib/logger/logger'

const logProductBaseForm = createLogger('admin.productBaseForm')
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/utils/utils'

import {
  createEmptyAttribute,
  ProductBaseAttributeEditor,
} from './ProductBaseAttributeEditor'
import { ProductBaseImageUploader } from './ProductBaseImageUploader'

type FormState = ProductBaseFormDto & {
  categoryPath: string[]
}

function withAttributeClientKeys(
  attributes: ProductBaseFormDto['attributes'],
): ProductBaseFormDto['attributes'] {
  return attributes.map((attr, index) => ({
    ...attr,
    clientKey: attr.clientKey ?? attr.id ?? crypto.randomUUID(),
    sortOrder: attr.sortOrder ?? index,
  }))
}

function buildCategoryPath(
  categories: AdminCategoryRow[],
  categoryId: string,
  subcategoryId?: string | null,
): string[] {
  if (!categoryId) return []

  if (!subcategoryId) {
    return [categoryId]
  }

  const byId = new Map(categories.map((category) => [category.id, category]))
  const path = [subcategoryId]
  let currentId: string | null | undefined = byId.get(subcategoryId)?.parentId ?? null

  while (currentId) {
    path.push(currentId)
    if (currentId === categoryId) {
      return path.reverse()
    }
    currentId = byId.get(currentId)?.parentId ?? null
  }

  return [categoryId, subcategoryId]
}

function buildInitialForm(
  initial?: ProductBaseDetailDto | null,
  categories: AdminCategoryRow[] = [],
  createPreset?: { categoryId: string; subcategoryId: string | null } | null,
): FormState {
  if (!initial && createPreset?.categoryId) {
    return {
      name: '',
      slug: '',
      description: '',
      categoryId: createPreset.categoryId,
      subcategoryId: createPreset.subcategoryId,
      categoryPath: buildCategoryPath(
        categories,
        createPreset.categoryId,
        createPreset.subcategoryId,
      ),
      type: 'PRODUCT',
      baseImageUrl: '',
      imageStrategy: 'BASE_OR_LISTING',
      attributes: [],
    }
  }

  if (!initial) {
    return {
      name: '',
      slug: '',
      description: '',
      categoryId: '',
      subcategoryId: null,
      categoryPath: [],
      type: 'PRODUCT',
      baseImageUrl: '',
      imageStrategy: 'BASE_OR_LISTING',
      attributes: [],
    }
  }

  return {
    name: initial.name,
    slug: initial.slug,
    description: initial.description ?? '',
    categoryId: initial.categoryId,
    subcategoryId: initial.subcategoryId,
    categoryPath: buildCategoryPath(categories, initial.categoryId, initial.subcategoryId),
    type: initial.type,
    baseImageUrl: initial.baseImageUrl ?? '',
    imageStrategy: initial.imageStrategy,
    attributes: withAttributeClientKeys(initial.attributes),
  }
}

export function ProductBaseFormDialog({
  open,
  onOpenChange,
  categories,
  initial,
  createPreset = null,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: AdminCategoryRow[]
  initial?: ProductBaseDetailDto | null
  createPreset?: { categoryId: string; subcategoryId: string | null } | null
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(initial, categories, createPreset),
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)

  const allowsBaseImage =
    form.imageStrategy === 'BASE_ONLY' || form.imageStrategy === 'BASE_OR_LISTING'

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(initial, categories, createPreset))
      setSlugTouched(Boolean(initial))
      setError(null)
    }
  }, [open, initial, categories, createPreset])

  const byId = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])

  const childrenByParent = useMemo(() => {
    const map = new Map<string, AdminCategoryRow[]>()
    for (const category of categories) {
      if (!category.parentId) continue
      const current = map.get(category.parentId) ?? []
      current.push(category)
      map.set(category.parentId, current)
    }
    return map
  }, [categories])

  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories],
  )

  const levels = useMemo(() => {
    if (!rootCategories.length) return []

    const memo = new Map<string, number>()
    const depth = (id: string): number => {
      if (memo.has(id)) return memo.get(id) as number
      const children = childrenByParent.get(id) ?? []
      const value = children.length === 0 ? 1 : 1 + Math.max(...children.map((child) => depth(child.id)))
      memo.set(id, value)
      return value
    }

    const maxDepth = Math.max(...rootCategories.map((root) => depth(root.id)))
    return Array.from({ length: Math.max(maxDepth, 1) }).map((_, index) => index)
  }, [childrenByParent, rootCategories])

  const categoryOptionsAtLevel = (level: number) => {
    if (level === 0) return rootCategories
    const parentId = form.categoryPath[level - 1]
    if (!parentId) return []
    return childrenByParent.get(parentId) ?? []
  }

  const selectedCategoryLabel = form.categoryPath
    .map((categoryId) => byId.get(categoryId)?.name ?? categoryId)
    .join(' → ')
  const categorySelectionValid = form.categoryPath.length > 0 && form.categoryPath.every((categoryId) => byId.has(categoryId))

  const setCategoryAtLevel = (level: number, categoryId: string) => {
    setForm((current) => {
      const nextPath = current.categoryPath.slice(0, level)
      nextPath[level] = categoryId
      return {
        ...current,
        categoryId: nextPath[0] ?? categoryId,
        subcategoryId: nextPath.length > 1 ? nextPath[nextPath.length - 1] : null,
        categoryPath: nextPath,
      }
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    logProductBaseForm.debug('submitting product base form', {
      mode: initial?.id ? 'update' : 'create',
      name: form.name,
      attributeCount: form.attributes.length,
    })
    const payload: ProductBaseFormDto = {
      ...form,
      slug: form.slug.trim() || slugifyProductBaseName(form.name),
      description: form.description || null,
      categoryId: form.categoryPath[0] ?? form.categoryId,
      subcategoryId:
        form.categoryPath.length > 1
          ? form.categoryPath[form.categoryPath.length - 1]
          : form.subcategoryId || null,
      baseImageUrl: form.baseImageUrl || null,
      attributes: form.attributes.map((attr, index) => {
        const { clientKey, ...rest } = attr
        void clientKey
        return { ...rest, sortOrder: index }
      }),
    }

    const result = initial
      ? await updateProductBaseAction({ ...payload, productBaseId: initial.id })
      : await createProductBaseAction(payload)

    setPending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Product Base' : 'Nuevo Product Base'}</DialogTitle>
          <DialogDescription>
            Definí la plantilla maestra y sus atributos dinámicos. Solo Superadmin puede editarlas.
          </DialogDescription>
        </DialogHeader>

        <form className='space-y-6' onSubmit={(event) => void handleSubmit(event)}>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='pb-name'>Nombre</Label>
              <Input
                id='pb-name'
                required
                value={form.name}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    name: e.target.value,
                    slug: slugTouched ? current.slug : slugifyProductBaseName(e.target.value),
                  }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='pb-slug'>Slug</Label>
              <Input
                id='pb-slug'
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((current) => ({ ...current, slug: e.target.value }))
                }}
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='pb-description'>Descripción</Label>
              <Textarea
                id='pb-description'
                value={form.description ?? ''}
                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, type: value as FormState['type'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_BASE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Estrategia de imagen</Label>
              <Select
                value={form.imageStrategy}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    imageStrategy: value as FormState['imageStrategy'],
                    baseImageUrl:
                      value === 'LISTING_REQUIRED' ? '' : current.baseImageUrl,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_BASE_IMAGE_STRATEGIES.map((strategy) => (
                    <SelectItem key={strategy} value={strategy}>
                      {strategy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-3 sm:col-span-2'>
              <div className='space-y-1'>
                <Label>Categorías</Label>
                <p className='text-sm text-muted-foreground'>
                  Elegí la ruta más profunda disponible para asociar el Product Base.
                </p>
              </div>

              {rootCategories.length ? (
                <div className='space-y-3'>
                  {levels.map((level) => {
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
                          onChange={(event) => setCategoryAtLevel(level, event.target.value)}
                        >
                          <option value='' disabled>
                            Elegí…
                          </option>
                          {options.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No hay categorías disponibles para seleccionar.
                </p>
              )}
            </div>

            <Separator className='sm:col-span-2' />

            {form.categoryPath.length > 0 ? (
              <div className='flex items-center justify-between gap-4 sm:col-span-2'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Categoría seleccionada</p>
                  <p className='text-sm text-muted-foreground'>{selectedCategoryLabel || '—'}</p>
                </div>
                <BadgeCheck
                  className={cn(
                    'size-5',
                    categorySelectionValid ? 'text-green-600' : 'text-muted-foreground',
                  )}
                />
              </div>
            ) : (
              <p className='text-sm text-muted-foreground sm:col-span-2'>
                Elegí una categoría para continuar.
              </p>
            )}
            {allowsBaseImage ? (
              <ProductBaseImageUploader
                imageUrl={form.baseImageUrl?.trim() || null}
                onImageUrlChange={(url) =>
                  setForm((current) => ({ ...current, baseImageUrl: url ?? '' }))
                }
                disabled={pending}
              />
            ) : null}
          </div>

          <ProductBaseAttributeEditor
            attributes={form.attributes}
            onChange={(attributes) => setForm((current) => ({ ...current, attributes }))}
          />

          {error ? (
            <p className='text-sm text-destructive' role='alert'>
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type='submit' disabled={pending}>
              {pending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              {initial ? 'Guardar cambios' : 'Crear Product Base'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { createEmptyAttribute }
