'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Loader2,
  PencilLine,
  Plus,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getListingTypeLabel, type ListingType } from '@/lib/listing'
import { cn } from '@/lib/utils'
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from '@/server/actions/category.actions'
import type { AdminCategoryRow } from '@/server/queries/admin/categories.queries'

const ADMIN_LISTING_TYPES = ['product', 'service', 'property'] as const satisfies readonly ListingType[]

type CategoryFormState = {
  name: string
  parentId: string
  isVisible: boolean
  listingType: (typeof ADMIN_LISTING_TYPES)[number]
}

const EMPTY_FORM: CategoryFormState = {
  name: '',
  parentId: '',
  isVisible: true,
  listingType: 'product',
}

function sortCategories(items: AdminCategoryRow[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
}

function getParentLabel(category: AdminCategoryRow, categories: AdminCategoryRow[]) {
  if (!category.parentId) return 'Raíz'
  return categories.find((item) => item.id === category.parentId)?.name ?? 'Raíz'
}

export function CategoriesAdminPanel({
  initialCategories,
}: {
  initialCategories: AdminCategoryRow[]
}) {
  const router = useRouter()
  const [categories, setCategories] = useState(() => sortCategories(initialCategories))

  useEffect(() => {
    setCategories(sortCategories(initialCategories))
  }, [initialCategories])

  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const editingCategory = useMemo(
    () => (editId ? categories.find((item) => item.id === editId) ?? null : null),
    [categories, editId],
  )

  const deletingCategory = useMemo(
    () => (deleteId ? categories.find((item) => item.id === deleteId) ?? null : null),
    [categories, deleteId],
  )

  const parentOptions = useMemo(
    () =>
      categories.filter(
        (item) => item.id !== editId && item.listingType === form.listingType,
      ),
    [categories, editId, form.listingType],
  )

  function syncFromServer() {
    router.refresh()
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setDeleteError(null)
    setEditId(null)
    setCreateOpen(true)
  }

  function openEdit(category: AdminCategoryRow) {
    setForm({
      name: category.name,
      parentId: category.parentId ?? '',
      isVisible: category.isVisible,
      listingType: category.listingType as CategoryFormState['listingType'],
    })
    setFormError(null)
    setDeleteError(null)
    setEditId(category.id)
    setCreateOpen(true)
  }

  function closeForm() {
    setCreateOpen(false)
    setEditId(null)
    setFormError(null)
    setDeleteError(null)
    setSubmitting(false)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = form.name.trim()
    if (!name) {
      setFormError('El nombre es obligatorio.')
      return
    }

    const duplicate = categories.some(
      (item) => item.name.trim().toLowerCase() === name.toLowerCase() && item.id !== editId,
    )
    if (duplicate) {
      setFormError('Ya existe una categoría con ese nombre.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    setDeleteError(null)

    const payload = {
      name,
      parentId: form.parentId || null,
      isVisible: form.isVisible,
      listingType: form.listingType,
    }

    try {
      if (editId) {
        await updateCategoryAction(editId, payload)
      } else {
        await createCategoryAction(payload)
      }

      closeForm()
      syncFromServer()
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : 'No se pudo guardar la categoría.',
      )
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteId) return

    setSubmitting(true)
    setDeleteError(null)

    try {
      const targetId = deleteId
      setDeleteId(null)
      await deleteCategoryAction(targetId)
      syncFromServer()
    } catch (deleteErrorValue) {
      setDeleteError(
        deleteErrorValue instanceof Error
          ? deleteErrorValue.message
          : 'No se pudo eliminar la categoría.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='space-y-6'>
      <Card className='shadow-sm'>
        <CardHeader className='gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-xl'>Taxonomía de categorías</CardTitle>
            <CardDescription>
              Gestioná categorías raíz, subcategorías y tipos de listing. Solo super-admin.
            </CardDescription>
          </div>

          <Button onClick={openCreate} className='gap-2 self-start'>
            <Plus className='size-4' />
            Nueva categoría
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className='p-0'>
          {categories.length === 0 ? (
            <div className='flex flex-col items-start gap-4 p-6'>
              <div className='space-y-1'>
                <p className='font-medium'>No hay categorías todavía.</p>
                <p className='text-sm text-muted-foreground'>
                  Creá la primera categoría para organizar el catálogo del marketplace.
                </p>
              </div>
              <Button onClick={openCreate} className='gap-2'>
                <Plus className='size-4' />
                Crear categoría
              </Button>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full border-separate border-spacing-0'>
                <thead className='bg-muted/40'>
                  <tr className='text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    <th className='px-6 py-4'>Nombre</th>
                    <th className='px-6 py-4'>Tipo</th>
                    <th className='px-6 py-4'>Padre</th>
                    <th className='px-6 py-4'>Visibilidad</th>
                    <th className='px-6 py-4 text-right'>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className='border-t'>
                      <td className='px-6 py-4'>
                        <div className='space-y-1'>
                          <p className='font-medium text-foreground'>{category.name}</p>
                          <p className='text-xs text-muted-foreground'>
                            ID: <span className='font-mono'>{category.id.slice(0, 8)}</span>
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <Badge variant='outline'>{getListingTypeLabel(category.listingType)}</Badge>
                      </td>
                      <td className='px-6 py-4 text-sm text-muted-foreground'>
                        {getParentLabel(category, categories)}
                      </td>
                      <td className='px-6 py-4'>
                        <Badge
                          variant={category.isVisible ? 'default' : 'secondary'}
                          className='gap-1.5'
                        >
                          {category.isVisible ? (
                            <Eye className='size-3.5' />
                          ) : (
                            <EyeOff className='size-3.5' />
                          )}
                          {category.isVisible ? 'Visible' : 'Oculta'}
                        </Badge>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex justify-end gap-1.5'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() => openEdit(category)}
                            aria-label={`Editar ${category.name}`}
                          >
                            <PencilLine className='size-4' />
                          </Button>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() => {
                              setDeleteError(null)
                              setDeleteId(category.id)
                            }}
                            aria-label={`Eliminar ${category.name}`}
                          >
                            <Trash2 className='size-4' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => (!open ? closeForm() : setCreateOpen(true))}
      >
        <DialogContent className='sm:max-w-lg'>
          <form onSubmit={handleSubmit} className='space-y-5'>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? `Editar ${editingCategory.name}` : 'Crear categoría'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Actualizá nombre, tipo, padre y visibilidad.'
                  : 'Definí una categoría raíz o vinculala como subcategoría.'}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='category-name'>Nombre</Label>
                <Input
                  id='category-name'
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder='Ej. Alimentos'
                  autoComplete='off'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='category-listing-type'>Tipo de listing</Label>
                <select
                  id='category-listing-type'
                  value={form.listingType}
                  onChange={(event) => {
                    const listingType = event.target.value as CategoryFormState['listingType']
                    setForm((current) => ({
                      ...current,
                      listingType,
                      parentId:
                        current.parentId &&
                        categories.some(
                          (item) =>
                            item.id === current.parentId && item.listingType === listingType,
                        )
                          ? current.parentId
                          : '',
                    }))
                  }}
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none',
                    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  )}
                >
                  {ADMIN_LISTING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {getListingTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='category-parent'>Categoría padre</Label>
                <select
                  id='category-parent'
                  value={form.parentId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, parentId: event.target.value }))
                  }
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none',
                    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  )}
                >
                  <option value=''>Raíz</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className='flex items-center gap-2 text-sm font-medium'>
                <input
                  type='checkbox'
                  checked={form.isVisible}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isVisible: event.target.checked }))
                  }
                  className='size-4 rounded border-input'
                />
                Visible para usuarios
              </label>

              {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={closeForm} disabled={submitting}>
                Cancelar
              </Button>
              <Button type='submit' disabled={submitting} className='gap-2'>
                {submitting ? <Loader2 className='size-4 animate-spin' /> : null}
                {editingCategory ? 'Guardar cambios' : 'Crear categoría'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => (!open ? setDeleteId(null) : null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              {deletingCategory
                ? `Vas a eliminar "${deletingCategory.name}". Confirmá para continuar.`
                : 'Confirmá la eliminación para continuar.'}
            </DialogDescription>
          </DialogHeader>

          {deleteError ? <p className='text-sm text-destructive'>{deleteError}</p> : null}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setDeleteId(null)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type='button' variant='destructive' onClick={confirmDelete} disabled={submitting}>
              {submitting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
