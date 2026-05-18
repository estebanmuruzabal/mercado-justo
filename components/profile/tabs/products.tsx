'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  PencilLine,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  createDraftListingAction,
  deleteListingAction,
  getListingsManagerDataAction,
  publishListingAction,
  updateListingDraftAction,
  type ListingManagerRow,
} from '@/server/actions/listing-manager.actions'
import {
  getListingTemplateForCategoryAction,
} from '@/server/actions/listing-catalog.actions'
import type {
  ListingType,
} from '@/lib/listing'
import type { CharacteristicMap, TemplateDef } from '@/lib/product'

type CategoryRow = {
  id: string
  name: string
  parent_id: string | null
  is_visible: boolean
}

// Base template always present; DB template adds extra sections/fields.
const BASE_TEMPLATE: TemplateDef = {
  sections: [
    {
      title: 'Información básica',
      fields: [
        { key: 'title', label: 'Título', type: 'text', required: true },
        { key: 'description', label: 'Descripción', type: 'textarea', required: true },
        { key: 'condition', label: 'Condición (new/used)', type: 'text', required: true },
        { key: 'stock', label: 'Stock', type: 'number' },
      ],
    },
  ],
}

type ModalStep = 1 | 2 | 3

type DraftFormState = {
  listingId: string | null
  listingType: ListingType | null
  categoryId: string | null
  categoryPath: string[]

  // Base fields
  title: string
  description: string
  condition: 'new' | 'used'
  stock: number

  // Category-specific
  characteristics: CharacteristicMap

  // Step 3
  price: number | null
  status: 'draft' | 'published'
}

const EMPTY_FORM: DraftFormState = {
  listingId: null,
  listingType: null,
  categoryId: null,
  categoryPath: [],
  title: '',
  description: '',
  condition: 'new',
  stock: 0,
  characteristics: {},
  price: null,
  status: 'draft',
}

function getCharacteristicKeysFromTemplate(template: TemplateDef) {
  const baseKeys = new Set(['title', 'description', 'condition', 'stock'])
  const keys = new Set<string>()
  for (const section of template.sections) {
    for (const field of section.fields) {
      if (!baseKeys.has(field.key)) keys.add(field.key)
    }
  }
  return keys
}

function applyTemplateToCharacteristics(params: {
  template: TemplateDef
  current: CharacteristicMap
}): CharacteristicMap {
  const { template, current } = params
  const allowed = getCharacteristicKeysFromTemplate(template)

  const next: CharacteristicMap = {}

  // Preserve existing values where still allowed.
  for (const key of Object.keys(current)) {
    if (allowed.has(key)) next[key] = current[key]
  }

  // Apply defaultValue for missing allowed fields.
  for (const section of template.sections) {
    for (const field of section.fields) {
      if (!allowed.has(field.key)) continue
      if (next[field.key] !== undefined) continue
      if (field.defaultValue !== undefined) next[field.key] = field.defaultValue
    }
  }

  return next
}

function isDeepest(categoryId: string, childrenByParent: Map<string, CategoryRow[]>) {
  return (childrenByParent.get(categoryId) ?? []).length === 0
}

function listingTypeLabel(listingType: ListingType) {
  if (listingType === 'product') return 'Product'
  if (listingType === 'service') return 'Service'
  return 'Property'
}

export function Products() {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const [managerLoading, setManagerLoading] = useState(true)
  const [managerError, setManagerError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<ListingManagerRow[]>([])
  const [published, setPublished] = useState<ListingManagerRow[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<ModalStep>(1)
  const [form, setForm] = useState<DraftFormState>(EMPTY_FORM)
  const [formBusy, setFormBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [listingTemplate, setListingTemplate] = useState<TemplateDef | null>(null)

  const [deleteCandidate, setDeleteCandidate] = useState<ListingManagerRow | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const childrenByParent = useMemo(() => {
    const map = new Map<string, CategoryRow[]>()
    for (const c of categories) {
      if (!c.parent_id) continue
      const arr = map.get(c.parent_id) ?? []
      arr.push(c)
      map.set(c.parent_id, arr)
    }
    return map
  }, [categories])

  const rootCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories])

  async function reloadManager() {
    setManagerLoading(true)
    setManagerError(null)
    try {
      const data = await getListingsManagerDataAction()
      setDrafts(data.drafts)
      setPublished(data.published)
    } catch (err) {
      setManagerError(err instanceof Error ? err.message : 'No se pudieron cargar tus listings.')
    } finally {
      setManagerLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      if (!form.listingType) {
        setCategories([])
        setCategoriesLoading(false)
        return
      }

      setCategoriesLoading(true)
      setCategoriesError(null)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('category')
        .select('id, name, parent_id, is_visible, listing_type')
        .eq('listing_type', form.listingType)
        .order('name', { ascending: true })

      if (error) {
        setCategoriesError(error.message)
        setCategories([])
      } else {
        setCategories((data ?? []) as CategoryRow[])
      }
      setCategoriesLoading(false)
    })()
  }, [form.listingType])

  useEffect(() => {
    if (!modalOpen) return
    if (!form.listingType || !form.categoryId) {
      setListingTemplate(null)
      return
    }

    void (async () => {
      try {
        const listingType = form.listingType
        const categoryId = form.categoryId

        if (!listingType || !categoryId) return

        const tpl = await getListingTemplateForCategoryAction(listingType, categoryId)
        setListingTemplate(tpl)

        // Ensure step 2 renders the correct fields and that `characteristics`
        // is pruned/initialized according to the new template.
        const merged: TemplateDef = tpl?.sections?.length
          ? { sections: [...BASE_TEMPLATE.sections, ...tpl.sections] }
          : BASE_TEMPLATE

        setForm((current) => ({
          ...current,
          characteristics: applyTemplateToCharacteristics({
            template: merged,
            current: current.characteristics,
          }),
        }))
      } catch {
        setListingTemplate(null)
      }
    })()
  }, [modalOpen, form.listingType, form.categoryId])

  useEffect(() => {
    void reloadManager()
  }, [refreshKey])

  function openCreateModalForListingType(listingType: ListingType) {
    setForm({
      ...EMPTY_FORM,
      status: 'draft',
      listingType,
    })
    setStep(1)
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(row: ListingManagerRow) {
    const characteristics = (row.characteristics ?? {}) as CharacteristicMap

    setForm({
      listingId: row.id,
      listingType: row.listingType,
      categoryId: row.categoryId,
      categoryPath: [],
      title: (row.title ?? '') as string,
      description: (row.description ?? '') as string,
      condition: (row.condition ?? 'new') as 'new' | 'used',
      stock: (row.stock ?? 0) as number,
      characteristics,
      price: row.price ?? null,
      status: row.status,
    })
    // We already know the listing type and category; jump directly to characteristics.
    setStep(2)
    setFormError(null)
    setModalOpen(true)
  }

  const template = useMemo(() => {
    if (!listingTemplate?.sections?.length) return BASE_TEMPLATE
    return {
      sections: [...BASE_TEMPLATE.sections, ...listingTemplate.sections],
    }
  }, [listingTemplate])

  const deepestSelectedOk =
    form.categoryId ? isDeepest(form.categoryId, childrenByParent) : false

  const categoryOptionsAtLevel = (level: number) => {
    if (level === 0) return rootCategories
    const parentId = form.categoryPath[level - 1]
    if (!parentId) return []
    return childrenByParent.get(parentId) ?? []
  }

  function setCategoryAtLevel(level: number, categoryId: string) {
    const nextPath = [...form.categoryPath]
    nextPath[level] = categoryId
    nextPath.splice(level + 1)

    setForm((current) => ({
      ...current,
      categoryPath: nextPath,
      categoryId,
    }))
  }

  async function handleStep1Next() {
    if (!form.listingType || !form.categoryId || !deepestSelectedOk) return

    setFormBusy(true)
    setFormError(null)
    try {
      if (!form.listingId) {
        const { id } = await createDraftListingAction(form.categoryId)
        setForm((current) => ({ ...current, listingId: id, status: 'draft' }))
      }

      const tpl = await getListingTemplateForCategoryAction(form.listingType, form.categoryId)
      setListingTemplate(tpl)

      // Apply defaults immediately so step 2 shows them without a flicker.
      const merged: TemplateDef = tpl?.sections?.length
        ? { sections: [...BASE_TEMPLATE.sections, ...tpl.sections] }
        : BASE_TEMPLATE

      setForm((current) => ({
        ...current,
        characteristics: applyTemplateToCharacteristics({
          template: merged,
          current: current.characteristics,
        }),
      }))

      setStep(2)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo continuar.')
    } finally {
      setFormBusy(false)
    }
  }

  async function handleStep2Next() {
    if (!form.listingId) return
    setFormBusy(true)
    setFormError(null)
    try {
      await updateListingDraftAction(form.listingId, {
        categoryId: form.categoryId ?? undefined,
        title: form.title,
        description: form.description,
        condition: form.condition,
        stock: form.stock,
        characteristics: form.characteristics,
      })
      setStep(3)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el borrador.')
    } finally {
      setFormBusy(false)
    }
  }

  async function handlePublish() {
    if (!form.listingId || form.price == null) return
    setFormBusy(true)
    setFormError(null)
    try {
      await updateListingDraftAction(form.listingId, {
        categoryId: form.categoryId ?? undefined,
        title: form.title,
        description: form.description,
        condition: form.condition,
        stock: form.stock,
        characteristics: form.characteristics,
      })
      await publishListingAction(form.listingId, { price: form.price })
      setModalOpen(false)
      setRefreshKey((v) => v + 1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo publicar.')
    } finally {
      setFormBusy(false)
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteCandidate) return
    setDeleteBusy(true)
    try {
      await deleteListingAction(deleteCandidate.id)
      setDeleteCandidate(null)
      setRefreshKey((v) => v + 1)
    } catch (err) {
      // keep it simple: show error at top of modal
      setFormError(err instanceof Error ? err.message : 'No se pudo eliminar.')
    } finally {
      setDeleteBusy(false)
    }
  }

  function renderStep1() {
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
              const maxDepth = rootCategories.length
                ? Math.max(...rootCategories.map((r) => depth(r.id)))
                : 0

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
            <BadgeCheck
              className={cn('size-5', deepestSelectedOk ? 'text-green-600' : 'text-muted-foreground')}
            />
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>Elegí una categoría para continuar.</p>
        )}

        {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

        <DialogFooter className='pt-2'>
          <Button
            type='button'
            disabled={!form.listingType || !deepestSelectedOk || formBusy}
            onClick={() => void handleStep1Next()}
          >
            {formBusy ? 'Creando borrador…' : 'Continuar'}
          </Button>
        </DialogFooter>
      </div>
    )
  }

  function renderCharacteristicFields() {
    const sections = template.sections

    return (
      <div className='space-y-4'>
        {sections.map((section) => (
          <details key={section.title} className='rounded-lg border bg-muted/20 p-3'>
            <summary className='cursor-pointer text-sm font-medium text-foreground'>
              {section.title}
            </summary>

            <div className='mt-3 space-y-3'>
              {section.fields.map((field) => {

                const value =
                  field.key === 'title'
                    ? form.title
                    : field.key === 'description'
                      ? form.description
                      : field.key === 'condition'
                        ? form.condition
                        : field.key === 'stock'
                          ? form.stock
                          : form.characteristics[field.key]

                const onChange = (val: string | number) => {
                  if (field.key === 'title') return setForm((c) => ({ ...c, title: String(val) }))
                  if (field.key === 'description')
                    return setForm((c) => ({ ...c, description: String(val) }))
                  if (field.key === 'condition') {
                    const next = String(val).toLowerCase()
                    const safe = next === 'used' ? 'used' : 'new'
                    return setForm((c) => ({ ...c, condition: safe }))
                  }
                  if (field.key === 'stock') return setForm((c) => ({ ...c, stock: Number(val) }))

                  setForm((c) => ({
                    ...c,
                    characteristics: { ...c.characteristics, [field.key]: val },
                  }))
                }

                return (
                  <div key={field.key} className='space-y-2'>
                    <Label>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className='min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
                        value={value == null ? '' : String(value)}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                      />
                    ) : field.type === 'number' ? (
                      <Input
                        type='number'
                        value={value == null ? '' : Number(value)}
                        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <Input
                        value={value == null ? '' : String(value)}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </details>
        ))}
      </div>
    )
  }

  function renderStep2() {
    return (
      <div className='space-y-5'>
        <div className='space-y-1'>
          <Label>Step 2 — Dynamic Characteristics</Label>
          <p className='text-sm text-muted-foreground'>
            Se completan los campos de acuerdo a tu categoría.
          </p>
        </div>

        {renderCharacteristicFields()}

        {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

        <DialogFooter className='pt-2'>
          <Button type='button' disabled={formBusy || !form.listingId} onClick={() => void handleStep2Next()}>
            {formBusy ? 'Guardando…' : 'Continuar'}
          </Button>
        </DialogFooter>
      </div>
    )
  }

  function renderStep3() {
    return (
      <div className='space-y-5'>
        <div className='space-y-1'>
          <Label>Step 3 — Pricing & Publish</Label>
          <p className='text-sm text-muted-foreground'>
            Definí el precio final y publicá el listing.
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='price'>Price</Label>
          <Input
            id='price'
            type='number'
            min='0.01'
            step='0.01'
            value={form.price ?? ''}
            onChange={(e) => setForm((c) => ({ ...c, price: e.target.value === '' ? null : Number(e.target.value) }))}
          />
        </div>

        {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

        <DialogFooter className='pt-2'>
          <Button
            type='button'
            variant='default'
            disabled={formBusy || form.price == null || !form.listingId}
            onClick={() => void handlePublish()}
          >
            <Upload className='mr-2 size-4' />
            {form.status === 'draft' ? 'Publicar' : 'Actualizar & Publicar'}
          </Button>
        </DialogFooter>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1'>
          <h2 className='text-xl font-bold'>Listings (productos)</h2>
          <p className='text-sm text-muted-foreground'>
            Creá, editá y publicá listings con borradores.
          </p>
        </div>

        <div className='flex flex-wrap justify-end gap-2'>
          <Button type='button' variant='secondary' className='gap-2' onClick={() => openCreateModalForListingType('product')}>
            <Plus className='size-4' />
            Product
          </Button>
          <Button type='button' variant='secondary' className='gap-2' onClick={() => openCreateModalForListingType('service')}>
            <Plus className='size-4' />
            Service
          </Button>
          <Button type='button' variant='secondary' className='gap-2' onClick={() => openCreateModalForListingType('property')}>
            <Plus className='size-4' />
            Property
          </Button>
        </div>
      </div>

      {categoriesLoading ? (
        <div className='space-y-3 rounded-lg border p-4'>
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-2/3' />
        </div>
      ) : categoriesError ? (
        <Card className='border-destructive/50'>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{categoriesError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Separator />

      <div className='space-y-3'>
        <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Drafts
        </h3>

        {managerLoading ? (
          <div className='space-y-3 rounded-lg border p-4'>
            <Skeleton className='h-4 w-36' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : managerError ? (
          <p className='text-sm text-destructive'>{managerError}</p>
        ) : drafts.length === 0 ? (
          <div className='rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground'>
            No tenés borradores todavía.
          </div>
        ) : (
          <div className='overflow-x-auto rounded-lg border'>
            <table className='min-w-full border-separate border-spacing-0'>
              <thead className='bg-muted/40'>
                <tr className='text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  <th className='px-4 py-3'>Title</th>
                  <th className='px-4 py-3'>Category</th>
                  <th className='px-4 py-3 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((row) => (
                  <tr key={row.id} className='border-t'>
                    <td className='px-4 py-3'>
                      <span className='font-medium'>{row.title ?? '(Sin título)'}</span>
                    </td>
                    <td className='px-4 py-3 text-sm text-muted-foreground'>
                      {row.categoryId ? byId.get(row.categoryId)?.name ?? row.categoryId : '—'}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex justify-end gap-2'>
                        <Button variant='ghost' size='icon' onClick={() => openEditModal(row)} aria-label='Edit draft'>
                          <PencilLine className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setDeleteCandidate(row)}
                          aria-label='Delete draft'
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
      </div>

      <Separator />

      <div className='space-y-3'>
        <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Published Listings
        </h3>

        {managerLoading ? null : published.length === 0 ? (
          <div className='rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground'>
            No tenés publicaciones publicadas.
          </div>
        ) : (
          <div className='overflow-x-auto rounded-lg border'>
            <table className='min-w-full border-separate border-spacing-0'>
              <thead className='bg-muted/40'>
                <tr className='text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  <th className='px-4 py-3'>Title</th>
                  <th className='px-4 py-3'>Category</th>
                  <th className='px-4 py-3 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {published.map((row) => (
                  <tr key={row.id} className='border-t'>
                    <td className='px-4 py-3'>
                      <span className='font-medium'>{row.title ?? '(Sin título)'}</span>
                    </td>
                    <td className='px-4 py-3 text-sm text-muted-foreground'>
                      {row.categoryId ? byId.get(row.categoryId)?.name ?? row.categoryId : '—'}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex justify-end gap-2'>
                        <Button variant='ghost' size='icon' onClick={() => openEditModal(row)} aria-label='Edit listing'>
                          <PencilLine className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setDeleteCandidate(row)}
                          aria-label='Delete listing'
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
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => setModalOpen(open)}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {form.listingId ? 'Edit Listing' : 'Create Listing'} — Step {step}/3
            </DialogTitle>
          </DialogHeader>

          {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteCandidate)} onOpenChange={(open) => (!open ? setDeleteCandidate(null) : null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            ¿Seguro que querés eliminar este listing? Esta acción no se puede deshacer.
          </p>
          <DialogFooter className='pt-4'>
            <Button variant='outline' disabled={deleteBusy} onClick={() => setDeleteCandidate(null)}>
              Cancel
            </Button>
            <Button variant='destructive' disabled={deleteBusy} onClick={() => void handleDeleteConfirmed()}>
              {deleteBusy ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}