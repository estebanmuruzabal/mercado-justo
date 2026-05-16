'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from '@/server/actions/category.actions'

type CategoryItem = {
  id: string
  name: string
  parentId: string | null
  isVisible: boolean
  createdAt: string
}

type CategoryFormState = {
  name: string
  parentId: string
  isVisible: boolean
}

const EMPTY_FORM: CategoryFormState = {
  name: '',
  parentId: '',
  isVisible: true,
}

function sortCategories(items: CategoryItem[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
}

function mapCategoryRow(row: {
  id: string
  name: string
  parent_id: string | null
  is_visible: boolean
  created_at: string
}): CategoryItem {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    isVisible: row.is_visible,
    createdAt: row.created_at,
  }
}

function getParentLabel(category: CategoryItem, categories: CategoryItem[]) {
  if (!category.parentId) return 'Root'
  return categories.find((item) => item.id === category.parentId)?.name ?? 'Root'
}

export function CategoriesTab() {
  const supabase = createClient()

  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  const editingCategory = useMemo(
    () => (editId ? categories.find((item) => item.id === editId) ?? null : null),
    [categories, editId]
  )

  const deletingCategory = useMemo(
    () => (deleteId ? categories.find((item) => item.id === deleteId) ?? null : null),
    [categories, deleteId]
  )

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('category')
        .select('id, name, parent_id, is_visible, created_at')
        .order('name', { ascending: true })

      if (!active) return

      if (fetchError) {
        setCategories([])
        setError(fetchError.message)
      } else {
        const mapped = (data ?? []).map(mapCategoryRow)
        setCategories(sortCategories(mapped))
      }

      setLoading(false)
    }

    void load()
    return () => {
      active = false
    }
  }, [supabase, refreshKey])

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setDeleteError(null)
    setEditId(null)
    setCreateOpen(true)
  }

  function openEdit(category: CategoryItem) {
    setForm({
      name: category.name,
      parentId: category.parentId ?? '',
      isVisible: category.isVisible,
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
      (item) => item.name.trim().toLowerCase() === name.toLowerCase() && item.id !== editId
    )
    if (duplicate) {
      setFormError('Ya existe una categoría con ese nombre.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    setDeleteError(null)

    try {
      if (editId) {
        await updateCategoryAction(editId, {
          name,
          parentId: form.parentId || null,
          isVisible: form.isVisible,
        })
      } else {
        await createCategoryAction({
          name,
          parentId: form.parentId || null,
          isVisible: form.isVisible,
        })
      }

      closeForm()
      setRefreshKey((v) => v + 1)
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : 'No se pudo guardar la categoría.'
      )
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteId) return

    setSubmitting(true)
    setDeleteError(null)

    try {
      setDeleteId(null)
      await deleteCategoryAction(deleteId)
      setRefreshKey((v) => v + 1)
    } catch (deleteErrorValue) {
      setDeleteError(
        deleteErrorValue instanceof Error
          ? deleteErrorValue.message
          : 'No se pudo eliminar la categoría.'
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
            <CardTitle className='text-xl'>Categorías</CardTitle>
            <CardDescription>
              Gestioná categorías raíz y dejá listo el esquema para subcategorías futuras.
            </CardDescription>
          </div>

          <Button onClick={openCreate} className='gap-2 self-start'>
            <Plus className='size-4' />
            Nueva categoría
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className='p-0'>
          {loading ? (
            <div className='space-y-3 p-6'>
              <div className='grid grid-cols-4 gap-4'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-24' />
                <Skeleton className='ml-auto h-4 w-16' />
              </div>
              <Separator />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className='grid grid-cols-4 gap-4 py-2'>
                  <Skeleton className='h-5 w-40' />
                  <Skeleton className='h-5 w-24' />
                  <Skeleton className='h-5 w-28' />
                  <Skeleton className='ml-auto h-8 w-20' />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className='space-y-4 p-6'>
              <p className='text-sm text-destructive'>{error}</p>
              <Button variant='outline' onClick={() => setRefreshKey((v) => v + 1)}>
                Reintentar
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <div className='flex flex-col items-start gap-4 p-6'>
              <div className='space-y-1'>
                <p className='font-medium'>No hay categorías todavía.</p>
                <p className='text-sm text-muted-foreground'>
                  Creá la primera categoría para empezar a organizar el catálogo.
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
                    <th className='px-6 py-4'>Category name</th>
                    <th className='px-6 py-4'>Parent category</th>
                    <th className='px-6 py-4'>Visibility status</th>
                    <th className='px-6 py-4 text-right'>Actions</th>
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
                      <td className='px-6 py-4 text-sm text-muted-foreground'>
                        {getParentLabel(category, categories)}
                      </td>
                      <td className='px-6 py-4'>
                        <Badge
                          variant={category.isVisible ? 'default' : 'secondary'}
                          className='gap-1.5'
                        >
                          {category.isVisible ? <Eye className='size-3.5' /> : <EyeOff className='size-3.5' />}
                          {category.isVisible ? 'Visible' : 'Hidden'}
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
                  ? 'Actualizá el nombre, el padre y la visibilidad.'
                  : 'Definí una categoría raíz o vinculala con otra categoría.'}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='category-name'>Category name</Label>
                <Input
                  id='category-name'
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder='Ej. Alimentos'
                  autoComplete='off'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='category-parent'>Parent category</Label>
                <select
                  id='category-parent'
                  value={form.parentId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, parentId: event.target.value }))
                  }
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none',
                    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
                  )}
                >
                  <option value=''>Root</option>
                  {categories
                    .filter((item) => item.id !== editId)
                    .map((item) => (
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
                Visible to users
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

