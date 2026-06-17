'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronsDownUp, ChevronsUpDown, Loader2, Plus } from 'lucide-react'

import { CategoryTree, CategoryTreeSearch } from '@/shared/admin-ui/categories/CategoryTree'
import type {
  CategoryTreeSource,
  ListingTypeFilter,
} from '@/shared/admin-ui/categories/types/category-tree.types'
import {
  adminRowToTreeSource,
  buildCategoryTreeWithProductBases,
  collectNodeIds,
  countCategoriesByListingType,
  isDescendantOf,
  productBasePlacementForCategory,
} from '@/shared/admin-ui/categories/utils/category-tree.utils'
import { getListingTypeLabel, type ListingType } from '@/domains/marketplace/listings/domain/listing'
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from '@/domains/marketplace/categories/application/actions/category.actions'
import type { AdminCategoryRow } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import {
  deleteProductBaseAction,
  duplicateProductBaseAction,
  getProductBaseDetailAction,
  setProductBaseStatusAction,
} from '@/domains/marketplace/product-base/application/actions/admin-product-base.actions'
import type {
  ProductBaseDetailDto,
  ProductBaseSummaryDto,
} from '@/domains/marketplace/product-base/application/dto/product-base.dto'
import { ProductBaseFormDialog } from '@/shared/admin-ui/product-bases/ProductBaseFormDialog'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
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
import { Separator } from '@/shared/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { cn } from '@/shared/utils/utils'

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

const LISTING_TYPE_FILTER_OPTIONS: { value: ListingTypeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...ADMIN_LISTING_TYPES.map((type) => ({
    value: type as ListingTypeFilter,
    label: getListingTypeLabel(type),
  })),
]

function isAdminListingTypeFilter(
  filter: ListingTypeFilter,
): filter is CategoryFormState['listingType'] {
  return filter === 'product' || filter === 'service' || filter === 'property'
}

function sortCategories(items: AdminCategoryRow[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
}

export function CategoriesAdminPanel({
  initialCategories,
  initialProductBases = [],
}: {
  initialCategories: AdminCategoryRow[]
  initialProductBases?: ProductBaseSummaryDto[]
}) {
  const router = useRouter()
  const [categories, setCategories] = useState(() => sortCategories(initialCategories))
  const [productBases, setProductBases] = useState(initialProductBases)

  useEffect(() => {
    setCategories(sortCategories(initialCategories))
  }, [initialCategories])

  useEffect(() => {
    setProductBases(initialProductBases)
  }, [initialProductBases])

  const [listingTypeFilter, setListingTypeFilter] = useState<ListingTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryTreeSource | null>(null)

  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reparenting, setReparenting] = useState(false)
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null)

  const [productBaseDialogOpen, setProductBaseDialogOpen] = useState(false)
  const [editingProductBase, setEditingProductBase] = useState<ProductBaseDetailDto | null>(null)
  const [productBaseCreatePreset, setProductBaseCreatePreset] = useState<{
    categoryId: string
    subcategoryId: string | null
  } | null>(null)
  const [loadingProductBaseId, setLoadingProductBaseId] = useState<string | null>(null)
  const [productBaseError, setProductBaseError] = useState<string | null>(null)

  const treeSources = useMemo(
    () => categories.map(adminRowToTreeSource),
    [categories],
  )

  const treeNodes = useMemo(
    () => buildCategoryTreeWithProductBases(treeSources, productBases, listingTypeFilter),
    [treeSources, productBases, listingTypeFilter],
  )

  const listingTypeCounts = useMemo(
    () => countCategoriesByListingType(treeSources),
    [treeSources],
  )

  const editingCategory = useMemo(
    () => (editId ? categories.find((item) => item.id === editId) ?? null : null),
    [categories, editId],
  )

  const parentOptions = useMemo(
    () =>
      categories.filter(
        (item) => item.id !== editId && item.listingType === form.listingType,
      ),
    [categories, editId, form.listingType],
  )

  const filteredCount = useMemo(() => {
    if (listingTypeFilter === 'all') return treeSources.length
    if (isAdminListingTypeFilter(listingTypeFilter)) return listingTypeCounts[listingTypeFilter]
    return 0
  }, [listingTypeCounts, listingTypeFilter, treeSources.length])

  function syncFromServer() {
    router.refresh()
  }

  function openCreate(preset?: Partial<CategoryFormState>) {
    setForm({
      ...EMPTY_FORM,
      listingType: isAdminListingTypeFilter(listingTypeFilter)
        ? listingTypeFilter
        : EMPTY_FORM.listingType,
      ...preset,
    })
    setFormError(null)
    setDeleteError(null)
    setEditId(null)
    setCreateOpen(true)
  }

  function openEdit(category: CategoryTreeSource) {
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

  function openCreateChild(parent: CategoryTreeSource) {
    openCreate({
      parentId: parent.id,
      listingType: parent.listingType as CategoryFormState['listingType'],
    })
  }

  function openCreateProductBase(category: CategoryTreeSource) {
    const placement = productBasePlacementForCategory(categories, category.id)
    setEditingProductBase(null)
    setProductBaseCreatePreset({
      categoryId: placement.categoryId,
      subcategoryId: placement.subcategoryId,
    })
    setProductBaseError(null)
    setProductBaseDialogOpen(true)
  }

  function closeProductBaseDialog() {
    setProductBaseDialogOpen(false)
    setEditingProductBase(null)
    setProductBaseCreatePreset(null)
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

  const handleToggleVisibility = useCallback(async (category: CategoryTreeSource) => {
    setTogglingVisibilityId(category.id)

    try {
      await updateCategoryAction(category.id, {
        name: category.name,
        parentId: category.parentId,
        isVisible: !category.isVisible,
        listingType: category.listingType as CategoryFormState['listingType'],
      })
      syncFromServer()
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'No se pudo cambiar la visibilidad.',
      )
    } finally {
      setTogglingVisibilityId(null)
    }
  }, [])

  const handleReparent = useCallback(
    async (categoryId: string, newParentId: string | null) => {
      const category = categories.find((item) => item.id === categoryId)
      if (!category) return

      if (newParentId === category.parentId) return

      if (newParentId && isDescendantOf(treeSources, newParentId, categoryId)) {
        setDeleteError('No se puede mover una categoría dentro de sus propios descendientes.')
        return
      }

      if (newParentId) {
        const newParent = categories.find((item) => item.id === newParentId)
        if (newParent && newParent.listingType !== category.listingType) {
          setDeleteError('La categoría padre debe tener el mismo tipo de listing.')
          return
        }
      }

      setReparenting(true)
      setDeleteError(null)

      try {
        await updateCategoryAction(categoryId, {
          name: category.name,
          parentId: newParentId,
          isVisible: category.isVisible,
          listingType: category.listingType as CategoryFormState['listingType'],
        })
        syncFromServer()
      } catch (error) {
        setDeleteError(
          error instanceof Error ? error.message : 'No se pudo mover la categoría.',
        )
      } finally {
        setReparenting(false)
      }
    },
    [categories, treeSources],
  )

  async function confirmDelete() {
    if (!deleteTarget) return

    setSubmitting(true)
    setDeleteError(null)

    try {
      const targetId = deleteTarget.id
      setDeleteTarget(null)
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

  function expandAll() {
    setExpandedIds(new Set(collectNodeIds(treeNodes)))
  }

  function collapseAll() {
    setExpandedIds(new Set())
  }

  const handleDeleteRequest = useCallback((category: CategoryTreeSource) => {
    setDeleteError(null)
    setProductBaseError(null)
    setDeleteTarget(category)
  }, [])

  const openProductBase = useCallback(async (productBaseId: string) => {
    setLoadingProductBaseId(productBaseId)
    setProductBaseError(null)

    const detail = await getProductBaseDetailAction(productBaseId)
    setLoadingProductBaseId(null)

    if (!detail) {
      setProductBaseError('No se pudo cargar el Product Base.')
      return
    }

    setEditingProductBase(detail)
    setProductBaseCreatePreset(null)
    setProductBaseDialogOpen(true)
  }, [])

  const handleDuplicateProductBase = useCallback(async (productBaseId: string) => {
    setLoadingProductBaseId(productBaseId)
    setProductBaseError(null)

    const result = await duplicateProductBaseAction({ productBaseId })
    setLoadingProductBaseId(null)

    if (!result.success) {
      setProductBaseError(result.error)
      return
    }

    syncFromServer()
  }, [])

  const handleProductBaseStatus = useCallback(
    async (productBaseId: string, status: ProductBaseSummaryDto['status']) => {
      setLoadingProductBaseId(productBaseId)
      setProductBaseError(null)

      const result = await setProductBaseStatusAction({ productBaseId, status })
      setLoadingProductBaseId(null)

      if (!result.success) {
        setProductBaseError(result.error)
        return
      }

      syncFromServer()
    },
    [],
  )

  const handleDeleteProductBase = useCallback(async (productBaseId: string) => {
    setLoadingProductBaseId(productBaseId)
    setProductBaseError(null)

    const result = await deleteProductBaseAction({ productBaseId })
    setLoadingProductBaseId(null)

    if (!result.success) {
      setProductBaseError(result.error)
      return
    }

    syncFromServer()
  }, [])

  const productBaseHandlers = useMemo(
    () => ({
      onOpen: (productBaseId: string) => void openProductBase(productBaseId),
      onEdit: (productBaseId: string) => void openProductBase(productBaseId),
      onDuplicate: (productBaseId: string) => void handleDuplicateProductBase(productBaseId),
      onToggleStatus: (productBaseId: string, status: ProductBaseSummaryDto['status']) =>
        void handleProductBaseStatus(productBaseId, status),
      onDelete: (productBaseId: string) => void handleDeleteProductBase(productBaseId),
    }),
    [handleDeleteProductBase, handleDuplicateProductBase, handleProductBaseStatus, openProductBase],
  )

  const actionHandlers = useMemo(
    () => ({
      onEdit: openEdit,
      onCreateChild: openCreateChild,
      onCreateProductBase: openCreateProductBase,
      onToggleVisibility: handleToggleVisibility,
      onDelete: handleDeleteRequest,
      onReparent: handleReparent,
    }),
    [handleDeleteRequest, handleReparent, handleToggleVisibility],
  )

  return (
    <div className='space-y-6'>
      <Card className='shadow-sm'>
        <CardHeader className='gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-xl'>Taxonomía de categorías</CardTitle>
            <CardDescription>
              Gestioná categorías, subcategorías y productos base asociados. Arrastrá para cambiar el padre.
            </CardDescription>
          </div>

          <Button onClick={() => openCreate()} className='gap-2 self-start'>
            <Plus className='size-4' />
            Nueva categoría
          </Button>
        </CardHeader>

        <Separator />

        <div className='space-y-4 p-4 sm:p-6'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <Tabs
              value={listingTypeFilter}
              onValueChange={(value) => setListingTypeFilter(value as ListingTypeFilter)}
            >
              <TabsList className='h-auto flex-wrap'>
                {LISTING_TYPE_FILTER_OPTIONS.map((option) => {
                  const count =
                    option.value === 'all'
                      ? treeSources.length
                      : isAdminListingTypeFilter(option.value)
                        ? listingTypeCounts[option.value]
                        : 0

                  return (
                    <TabsTrigger key={option.value} value={option.value} className='gap-2'>
                      {option.label}
                      <Badge variant='secondary' className='px-1.5 py-0 text-xs'>
                        {count}
                      </Badge>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>

            <div className='flex flex-wrap items-center gap-2'>
              <Button type='button' variant='outline' size='sm' className='gap-1.5' onClick={expandAll}>
                <ChevronsUpDown className='size-4' />
                Expandir todo
              </Button>
              <Button type='button' variant='outline' size='sm' className='gap-1.5' onClick={collapseAll}>
                <ChevronsDownUp className='size-4' />
                Contraer todo
              </Button>
            </div>
          </div>

          <CategoryTreeSearch value={searchQuery} onChange={setSearchQuery} />

          <p className='text-sm text-muted-foreground'>
            {filteredCount} categoría{filteredCount === 1 ? '' : 's'}
            {listingTypeFilter !== 'all' && isAdminListingTypeFilter(listingTypeFilter)
              ? ` de tipo ${getListingTypeLabel(listingTypeFilter)}`
              : ' en total'}
            {' · '}
            {productBases.length} producto{productBases.length === 1 ? '' : 's'} base
          </p>

          {deleteError ? (
            <p className='rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'>
              {deleteError}
            </p>
          ) : null}

          {productBaseError ? (
            <p className='rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'>
              {productBaseError}
            </p>
          ) : null}
        </div>

        <CardContent className='p-0'>
          {categories.length === 0 ? (
            <div className='flex flex-col items-start gap-4 p-6'>
              <div className='space-y-1'>
                <p className='font-medium'>No hay categorías todavía.</p>
                <p className='text-sm text-muted-foreground'>
                  Creá la primera categoría para organizar el catálogo del marketplace.
                </p>
              </div>
              <Button onClick={() => openCreate()} className='gap-2'>
                <Plus className='size-4' />
                Crear categoría
              </Button>
            </div>
          ) : (
            <CategoryTree
              nodes={treeNodes}
              searchQuery={searchQuery}
              expandedIds={expandedIds}
              onExpandedChange={setExpandedIds}
              actionHandlers={actionHandlers}
              productBaseHandlers={productBaseHandlers}
              isReparenting={reparenting}
              togglingVisibilityId={togglingVisibilityId}
              loadingProductBaseId={loadingProductBaseId}
            />
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

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Vas a eliminar "${deleteTarget.name}". Confirmá para continuar.`
                : 'Confirmá la eliminación para continuar.'}
            </DialogDescription>
          </DialogHeader>

          {deleteError ? <p className='text-sm text-destructive'>{deleteError}</p> : null}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setDeleteTarget(null)}
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

      <ProductBaseFormDialog
        open={productBaseDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeProductBaseDialog()
          else setProductBaseDialogOpen(true)
        }}
        categories={categories}
        initial={editingProductBase}
        createPreset={productBaseCreatePreset}
        onSaved={syncFromServer}
      />
    </div>
  )
}
