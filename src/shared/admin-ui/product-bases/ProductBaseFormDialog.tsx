'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'

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

import {
  createEmptyAttribute,
  ProductBaseAttributeEditor,
} from './ProductBaseAttributeEditor'
import { ProductBaseImageUploader } from './ProductBaseImageUploader'

type FormState = ProductBaseFormDto

function withAttributeClientKeys(
  attributes: ProductBaseFormDto['attributes'],
): ProductBaseFormDto['attributes'] {
  return attributes.map((attr, index) => ({
    ...attr,
    clientKey: attr.clientKey ?? attr.id ?? crypto.randomUUID(),
    sortOrder: attr.sortOrder ?? index,
  }))
}

function buildInitialForm(initial?: ProductBaseDetailDto | null): FormState {
  if (!initial) {
    return {
      name: '',
      slug: '',
      description: '',
      categoryId: '',
      subcategoryId: null,
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
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: AdminCategoryRow[]
  initial?: ProductBaseDetailDto | null
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(initial))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)

  const allowsBaseImage =
    form.imageStrategy === 'BASE_ONLY' || form.imageStrategy === 'BASE_OR_LISTING'

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(initial))
      setSlugTouched(Boolean(initial))
      setError(null)
    }
  }, [open, initial])

  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories],
  )

  const subcategories = useMemo(
    () => categories.filter((category) => category.parentId === form.categoryId),
    [categories, form.categoryId],
  )

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
      subcategoryId: form.subcategoryId || null,
      baseImageUrl: form.baseImageUrl || null,
      attributes: form.attributes.map(({ clientKey: _clientKey, ...attr }, index) => ({
        ...attr,
        sortOrder: index,
      })),
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
            <div className='space-y-2'>
              <Label>Categoría</Label>
              <Select
                value={form.categoryId || undefined}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: value,
                    subcategoryId: null,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccionar categoría' />
                </SelectTrigger>
                <SelectContent>
                  {rootCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Subcategoría</Label>
              <Select
                value={form.subcategoryId ?? 'none'}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    subcategoryId: value === 'none' ? null : value,
                  }))
                }
                disabled={subcategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Opcional' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Sin subcategoría</SelectItem>
                  {subcategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
