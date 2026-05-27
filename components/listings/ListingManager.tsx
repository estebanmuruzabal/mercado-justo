'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BadgeCheck, PencilLine, Plus, Trash2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DialogFooter } from '@/components/ui/dialog'
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
  getListingVariantsAction,
  publishListingAction,
  setListingDraftStatusAction,
  upsertListingVariantsAction,
  updateListingDraftAction,
  type ListingManagerRow,
} from '@/server/actions/listing-manager.actions'
import { getListingTemplateForCategoryAction } from '@/server/actions/listing-catalog.actions'
import type { ListingType } from '@/lib/listing'
import type { CharacteristicMap, TemplateDef } from '@/lib/product'
import { VariantEditor } from '@/components/listings/variants/VariantEditor'
import type { VariantEditorValue } from '@/components/listings/variants/VariantCard'
import { ListingManagerModal } from '@/components/listings/listing-manager/ListingManagerModal'

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
  latitude: number | null
  longitude: number | null

  // Category-specific
  characteristics: CharacteristicMap

  // Variants toggle
  enableVariants: boolean

  // Simple mode (no variants)
  simplePrice: number | null
  simpleSku: string | null

  // Used for legacy publishing (derived from variants when enableVariants=true)
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
  latitude: null,
  longitude: null,
  characteristics: {},
  enableVariants: false,
  simplePrice: null,
  simpleSku: null,
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

export function ListingManager() {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const [managerLoading, setManagerLoading] = useState(true)
  const [managerError, setManagerError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<ListingManagerRow[]>([])
  const [published, setPublished] = useState<ListingManagerRow[]>([])
  const [sellerLocation, setSellerLocation] = useState<{ latitude: number | null; longitude: number | null } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<ModalStep>(1)
  const [form, setForm] = useState<DraftFormState>(EMPTY_FORM)
  const [formBusy, setFormBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [listingTemplate, setListingTemplate] = useState<TemplateDef | null>(null)

  const [variantsLoading, setVariantsLoading] = useState(false)
  const [variants, setVariants] = useState<VariantEditorValue[]>([])
  const variantsLoadedForRef = useRef<string | null>(null)

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
      setSellerLocation(data.sellerLocation)
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
    if (!modalOpen) return
    if (!form.listingId) return
    // Reset variant cache when switching to a different listing.
    variantsLoadedForRef.current = null
    setVariants([])
    setVariantsLoading(false)
  }, [modalOpen, form.listingId])

  useEffect(() => {
    if (!modalOpen) return
    if (step !== 2) return
    if (!form.enableVariants) return
    if (!form.listingId) return
    if (variantsLoadedForRef.current === form.listingId) return

    setVariantsLoading(true)

    void (async () => {
      try {
        const rows = await getListingVariantsAction(form.listingId as string)
        const mapped: VariantEditorValue[] = rows.map((r) => {
          const attributes: Record<string, string> = {}
          for (const [k, v] of Object.entries(r.attributesJson ?? {})) {
            if (typeof v === 'string') attributes[k] = v
            else attributes[k] = JSON.stringify(v)
          }

          return {
            clientId: r.id,
            id: r.id,
            name: r.name ?? '',
            sku: r.sku,
            price: r.price,
            stock: r.stock,
            isDefault: r.isDefault,
            attributes,
          }
        })
        setVariants(mapped)
        variantsLoadedForRef.current = form.listingId
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'No se pudieron cargar las variantes.')
      } finally {
        setVariantsLoading(false)
      }
    })()
  }, [modalOpen, step, form.listingId, form.enableVariants])

  useEffect(() => {
    if (!modalOpen) return
    if (!form.enableVariants) return
    if (!variants.length) return

    const def = variants.find((v) => v.isDefault) ?? variants[0]
    if (!def) return
    setForm((c) => ({ ...c, price: def.price }))
  }, [modalOpen, form.enableVariants, variants])

  useEffect(() => {
    void reloadManager()
  }, [refreshKey])

  useEffect(() => {
    // If seller coordinates were not loaded yet when opening the create modal,
    // fill them in without overwriting user edits.
    if (!modalOpen) return
    if (form.listingType !== 'product') return
    if (form.latitude != null || form.longitude != null) return
    if (!sellerLocation) return
    if (sellerLocation.latitude == null || sellerLocation.longitude == null) return

    setForm((c) => ({
      ...c,
      latitude: sellerLocation.latitude,
      longitude: sellerLocation.longitude,
    }))
  }, [modalOpen, form.listingType, form.latitude, form.longitude, sellerLocation])

  function openCreateModalForListingType(listingType: ListingType) {
    setForm({
      ...EMPTY_FORM,
      status: 'draft',
      listingType,
      latitude: listingType === 'product' ? sellerLocation?.latitude ?? null : null,
      longitude: listingType === 'product' ? sellerLocation?.longitude ?? null : null,
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
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      characteristics,
      // Legacy price is treated as simple mode price by default.
      // If the listing has variants, the UI will let the seller enable variants.
      enableVariants: false,
      simplePrice: row.price ?? null,
      simpleSku: null,
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

  const deepestSelectedOk = form.categoryId ? isDeepest(form.categoryId, childrenByParent) : false

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
        stock: form.enableVariants ? 0 : form.stock,
        // Legacy: in simple mode, price lives on `listing.price`.
        price: form.enableVariants ? undefined : form.simplePrice ?? undefined,
        characteristics: form.characteristics,
        ...(form.listingType === 'product'
          ? { latitude: form.latitude, longitude: form.longitude }
          : {}),
      })

      setStep(3)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el borrador.')
    } finally {
      setFormBusy(false)
    }
  }

  async function handlePublish() {
    if (!form.listingId) return
    const publishPrice = form.enableVariants
      ? form.price
      : form.simplePrice

    if (form.enableVariants) {
      if (variants.length < 1) {
        setFormError('Activaste variantes, pero no agregaste ninguna variante.')
        return
      }
      if (variants.some((v) => !v.name.trim() || v.price <= 0 || v.stock < 0)) {
        setFormError('Revisá tus variantes: cada variante debe tener nombre, precio y stock.')
        return
      }
    } else {
      if (form.simplePrice == null) {
        setFormError('Definí el precio para el modo simple.')
        return
      }
      if (form.stock < 0) {
        setFormError('Definí un stock válido.')
        return
      }
    }

    if (publishPrice == null) {
      setFormError('Falta definir el precio.')
      return
    }
    setFormBusy(true)
    setFormError(null)
    try {
      // Persist base listing (legacy columns) + either variants or simple mode.
      await updateListingDraftAction(form.listingId, {
        categoryId: form.categoryId ?? undefined,
        title: form.title,
        description: form.description,
        condition: form.condition,
        stock: form.enableVariants ? 0 : form.stock,
        price: form.enableVariants ? undefined : form.simplePrice ?? undefined,
        characteristics: form.characteristics,
        ...(form.listingType === 'product'
          ? { latitude: form.latitude, longitude: form.longitude }
          : {}),
      })

      if (form.enableVariants) {
        await upsertListingVariantsAction(
          form.listingId,
          variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            isDefault: v.isDefault,
            attributesJson: v.attributes,
          }))
        )
      }

      await publishListingAction(form.listingId, {
        price: publishPrice,
        simpleSku: form.enableVariants ? null : form.simpleSku,
      })
      setModalOpen(false)
      setRefreshKey((v) => v + 1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo publicar.')
    } finally {
      setFormBusy(false)
    }
  }

  async function handleSaveDraft() {
    if (!form.listingId) return

    if (form.enableVariants) {
      if (variants.length < 1) {
        setFormError('Activaste variantes, pero no agregaste ninguna variante.')
        return
      }
      if (variants.some((v) => !v.name.trim() || v.price <= 0 || v.stock < 0)) {
        setFormError('Revisá tus variantes: cada variante debe tener nombre, precio y stock.')
        return
      }
    } else {
      if (form.simplePrice == null) {
        setFormError('Definí el precio para el modo simple.')
        return
      }
      if (form.stock < 0) {
        setFormError('Definí un stock válido.')
        return
      }
    }

    setFormBusy(true)
    setFormError(null)
    try {
      await updateListingDraftAction(form.listingId, {
        categoryId: form.categoryId ?? undefined,
        title: form.title,
        description: form.description,
        condition: form.condition,
        stock: form.enableVariants ? 0 : form.stock,
        price: form.enableVariants ? undefined : form.simplePrice ?? undefined,
        characteristics: form.characteristics,
        ...(form.listingType === 'product'
          ? { latitude: form.latitude, longitude: form.longitude }
          : {}),
      })

      if (form.enableVariants) {
        await upsertListingVariantsAction(
          form.listingId,
          variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            isDefault: v.isDefault,
            attributesJson: v.attributes,
          }))
        )
      }

      await setListingDraftStatusAction(form.listingId)
      setModalOpen(false)
      setRefreshKey((v) => v + 1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el borrador.')
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

  function _renderStep1() {
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
            <BadgeCheck className={cn('size-5', deepestSelectedOk ? 'text-green-600' : 'text-muted-foreground')} />
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

    let didRenderToggle = false

    return (
      <div className='space-y-4'>
        {sections.map((section) => (
          <details key={section.title} className='rounded-lg border bg-muted/20 p-3'>
            <summary className='cursor-pointer text-sm font-medium text-foreground'>{section.title}</summary>

            <div className='mt-3 space-y-3'>
              {section.fields.map((field) => {
                if (field.key === 'stock' && form.enableVariants) return null

                const shouldRenderToggle = field.key === 'condition' && !didRenderToggle
                if (shouldRenderToggle) didRenderToggle = true

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

                    {shouldRenderToggle ? (
                      <div className='mt-2 space-y-2'>
                        <div className='flex items-center justify-between gap-4 rounded-xl border bg-muted/10 p-3'>
                          <div className='space-y-0.5'>
                            <Label>Enable variants</Label>
                            <p className='text-xs text-muted-foreground'>
                              Si activás variantes, el precio/stock van por variante.
                            </p>
                          </div>
                          <input
                            type='checkbox'
                            checked={form.enableVariants}
                            onChange={(e) => setForm((c) => ({ ...c, enableVariants: e.target.checked }))}
                            aria-label='Enable variants'
                          />
                        </div>

                        {form.enableVariants ? (
                          <div className='space-y-5'>
                            <div className='space-y-1'>
                              <Label>Variants</Label>
                              <p className='text-sm text-muted-foreground'>
                                Agregá variantes comprables con atributos dinámicos.
                              </p>
                            </div>

                            {variantsLoading ? (
                              <div className='space-y-3'>
                                <Skeleton className='h-6 w-40' />
                                <Skeleton className='h-24 w-full' />
                              </div>
                            ) : (
                              <VariantEditor variants={variants} onChange={setVariants} />
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </details>
        ))}
      </div>
    )
  }

  function _renderStep2() {
    return (
      <div className='space-y-5'>
        <div className='space-y-1'>
          <Label>Step 2 — Basic Information</Label>
          <p className='text-sm text-muted-foreground'>Completá la info básica y elegí si este producto tiene variantes.</p>
        </div>

        {renderCharacteristicFields()}

        {!form.enableVariants ? (
          <div className='space-y-2 rounded-xl border bg-background p-4'>
            <div className='space-y-1'>
              <Label htmlFor='simplePrice'>Price</Label>
              <Input
                id='simplePrice'
                type='number'
                min='0.01'
                step='0.01'
                value={form.simplePrice ?? ''}
                onChange={(e) =>
                  setForm((c) => ({ ...c, simplePrice: e.target.value === '' ? null : Number(e.target.value) }))
                }
              />
            </div>

            <div className='space-y-1'>
              <Label htmlFor='simpleSku'>SKU (opcional)</Label>
              <Input
                id='simpleSku'
                value={form.simpleSku ?? ''}
                onChange={(e) => setForm((c) => ({ ...c, simpleSku: e.target.value === '' ? null : e.target.value }))}
                placeholder='e.g. rem-nero'
              />
            </div>
          </div>
        ) : null}

        {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

        <DialogFooter className='pt-2'>
          <div className='flex w-full items-center justify-between gap-2'>
            <Button type='button' variant='outline' disabled={formBusy} onClick={() => setStep(1)}>
              Back
            </Button>

            <Button
              type='button'
              disabled={formBusy || form.simplePrice == null && !form.enableVariants}
              onClick={() => void handleStep2Next()}
            >
              {formBusy ? 'Guardando…' : 'Next: Review'}
            </Button>
          </div>
        </DialogFooter>
      </div>
    )
  }

  function _renderStep3() {
    return renderStep4()
  }

  function renderStep4() {
    const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0]
    const imageFromVariant =
      defaultVariant?.attributes && typeof defaultVariant.attributes.image === 'string'
        ? (defaultVariant.attributes.image as string)
        : null
    const imageFromLegacy =
      typeof form.characteristics?.image === 'string' ? (form.characteristics.image as string) : null
    const reviewImage = imageFromVariant ?? imageFromLegacy

    return (
      <div className='space-y-5'>
        <div className='space-y-1'>
          <Label>Step 3 — Review & Publish</Label>
          <p className='text-sm text-muted-foreground'>Revisá todo y elegí si guardás como borrador o publicás.</p>
        </div>

        <div className='space-y-3 rounded-xl border bg-background p-4'>
          <div className='space-y-1'>
            <Label>Category</Label>
            <p className='text-sm text-muted-foreground'>
              {form.categoryPath.map((id) => byId.get(id)?.name ?? id).join(' → ') || byId.get(form.categoryId ?? '')?.name || '—'}
            </p>
          </div>

          <div className='space-y-1'>
            <Label>Title</Label>
            <p className='text-sm font-semibold'>{form.title || '—'}</p>
          </div>

          {reviewImage ? (
            <div className='space-y-2'>
              <Label>Preview</Label>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={reviewImage} alt={form.title || 'preview'} className='h-40 w-full rounded-md object-cover' />
            </div>
          ) : null}

          <div className='space-y-1'>
            <Label>Description</Label>
            <p className='text-sm text-muted-foreground'>{form.description || '—'}</p>
          </div>

          <div className='space-y-2'>
            <Label>Characteristics</Label>
            <div className='flex flex-wrap gap-2'>
              {Object.entries(form.characteristics)
                .slice(0, 12)
                .map(([k, v]) => (
                  <span
                    key={k}
                    className='rounded-md border bg-muted/10 px-2 py-1 text-xs text-muted-foreground'
                  >
                    {k}:{' '}
                    {typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
                      ? String(v)
                      : JSON.stringify(v)}
                  </span>
                ))}
              {Object.keys(form.characteristics).length === 0 ? (
                <span className='text-sm text-muted-foreground'>—</span>
              ) : null}
            </div>
          </div>

          {form.enableVariants ? (
            <div className='space-y-2'>
              <Label>Variants</Label>
              <div className='space-y-2'>
                {variants.length === 0 ? (
                  <p className='text-sm text-destructive'>Necesitás al menos 1 variante.</p>
                ) : (
                  variants.map((v, idx) => (
                    <div key={v.id ?? `${v.sku}-${idx}`} className='rounded-lg border bg-muted/10 p-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='space-y-0.5'>
                          <p className='text-sm font-semibold'>{v.sku || '(Sin SKU)'}</p>
                          <p className='text-xs text-muted-foreground'>Price: ${v.price}</p>
                          <p className='text-xs text-muted-foreground'>Stock: {v.stock}</p>
                        </div>
                        {v.isDefault ? <span className='text-xs text-muted-foreground'>(default)</span> : null}
                      </div>

                      <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1'>
                        {Object.entries(v.attributes).slice(0, 6).map(([k, val]) => (
                          <span key={k} className='text-xs text-muted-foreground'>
                            {k}: {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className='text-sm text-muted-foreground'>
                Total stock: {variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)}
              </div>
            </div>
          ) : (
            <div className='space-y-2'>
              <Label>Simple listing</Label>
              <div className='grid gap-2 sm:grid-cols-2'>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>Stock</p>
                  <p className='text-sm font-semibold'>{form.stock}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>Price</p>
                  <p className='text-sm font-semibold'>{form.simplePrice ?? '—'}</p>
                </div>
              </div>
              {form.simpleSku ? (
                <div className='text-sm text-muted-foreground'>SKU: {form.simpleSku}</div>
              ) : null}
            </div>
          )}
        </div>

        {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

        <DialogFooter className='pt-2'>
          <div className='flex w-full items-center justify-between gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={formBusy}
              onClick={() => setStep(2)}
            >
              Back
            </Button>

            <div className='flex gap-2'>
              <Button
                type='button'
                variant='secondary'
                disabled={formBusy}
                onClick={() => void handleSaveDraft()}
              >
                Save Draft
              </Button>

              <Button
                type='button'
                variant='default'
                disabled={formBusy || !form.listingId}
                onClick={() => void handlePublish()}
              >
                <Upload className='mr-2 size-4' />
                {form.status === 'draft' ? 'Publish' : 'Update & Publish'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </div>
    )
  }

  // Legacy step render helpers were extracted into `ListingManagerModal`.
  // These references keep ESLint happy without changing runtime behavior.
  void _renderStep1
  void _renderStep2
  void _renderStep3

  return (
    <div className='space-y-6'>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1'>
          <h2 className='text-xl font-bold'>Listings (productos)</h2>
          <p className='text-sm text-muted-foreground'>Creá, editá y publicá listings con borradores.</p>
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
        <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>Drafts</h3>

        {managerLoading ? (
          <div className='space-y-3 rounded-lg border p-4'>
            <Skeleton className='h-4 w-36' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : managerError ? (
          <p className='text-sm text-destructive'>{managerError}</p>
        ) : drafts.length === 0 ? (
          <div className='rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground'>No tenés borradores todavía.</div>
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
        <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>Published Listings</h3>

        {managerLoading ? null : published.length === 0 ? (
          <div className='rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground'>No tenés publicaciones publicadas.</div>
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

      <ListingManagerModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        step={step}
        setStep={setStep}
        form={form}
        template={template}
        byId={byId}
        rootCategories={rootCategories}
        childrenByParent={childrenByParent}
        categoryOptionsAtLevel={categoryOptionsAtLevel}
        setCategoryAtLevel={setCategoryAtLevel}
        deepestSelectedOk={deepestSelectedOk}
        listingTypeLabel={(lt) => (lt ? listingTypeLabel(lt) : '')}
        formBusy={formBusy}
        formError={formError}
        handleStep1Next={handleStep1Next}
        handleStep2Next={handleStep2Next}
        handleSaveDraft={handleSaveDraft}
        handlePublish={handlePublish}
        sellerLocation={sellerLocation}
        variants={variants}
        variantsLoading={variantsLoading}
        setVariants={setVariants}
        setForm={setForm}
        deleteCandidate={deleteCandidate}
        setDeleteCandidate={setDeleteCandidate}
        deleteBusy={deleteBusy}
        handleDeleteConfirmed={handleDeleteConfirmed}
      />
    </div>
  )
}

