import { useEffect } from 'react'

import { createClient } from '@/shared/database/supabase/client'
import {
  getListingsManagerDataAction,
  getListingVariantsAction,
} from '@/domains/marketplace/listings/application/actions/listing-manager.actions'
import { getListingTemplateForCategoryAction } from '@/domains/marketplace/listings/application/actions/listing-catalog.actions'
import type { ListingManagerRow } from '@/domains/marketplace/listings/application/actions/listing-manager.actions'
import type { TemplateDef } from '@/domains/marketplace/listings/domain/product'
import type { VariantEditorValue } from '@/domains/marketplace/listings/presentation/components/variants/VariantCard'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

import { BASE_TEMPLATE } from '../constants'
import type { CategoryRow, DraftFormState, ModalStep } from '../types'
import { buildCategoryPath } from '../utils/category.utils'
import { applyTemplateToCharacteristics, mergeListingTemplate } from '../utils/listing-template.utils'

type ListingManagerEffectsParams = {
  form: DraftFormState
  modalOpen: boolean
  step: ModalStep
  variants: VariantEditorValue[]
  refreshKey: number
  sellerLocation: { latitude: number | null; longitude: number | null } | null
  byId: Map<string, CategoryRow>
  variantsLoadedForRef: MutableRefObject<string | null>
  setCategories: Dispatch<SetStateAction<CategoryRow[]>>
  setCategoriesLoading: Dispatch<SetStateAction<boolean>>
  setCategoriesError: Dispatch<SetStateAction<string | null>>
  setManagerLoading: Dispatch<SetStateAction<boolean>>
  setManagerError: Dispatch<SetStateAction<string | null>>
  setDrafts: Dispatch<SetStateAction<ListingManagerRow[]>>
  setPublished: Dispatch<SetStateAction<ListingManagerRow[]>>
  setSellerLocation: Dispatch<SetStateAction<{ latitude: number | null; longitude: number | null } | null>>
  setListingTemplate: Dispatch<SetStateAction<TemplateDef | null>>
  setForm: Dispatch<SetStateAction<DraftFormState>>
  setVariants: Dispatch<SetStateAction<VariantEditorValue[]>>
  setVariantsLoading: Dispatch<SetStateAction<boolean>>
  setFormError: Dispatch<SetStateAction<string | null>>
}

export function useListingManagerEffects(params: ListingManagerEffectsParams) {
  const {
    form,
    modalOpen,
    step,
    variants,
    refreshKey,
    sellerLocation,
    byId,
    variantsLoadedForRef,
    setCategories,
    setCategoriesLoading,
    setCategoriesError,
    setManagerLoading,
    setManagerError,
    setDrafts,
    setPublished,
    setSellerLocation,
    setListingTemplate,
    setForm,
    setVariants,
    setVariantsLoading,
    setFormError,
  } = params

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
  }, [form.listingType, setCategories, setCategoriesError, setCategoriesLoading])

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

        const merged = mergeListingTemplate(tpl, BASE_TEMPLATE)
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
  }, [modalOpen, form.listingType, form.categoryId, setForm, setListingTemplate])

  useEffect(() => {
    if (!modalOpen) return
    if (!form.listingId) return
    variantsLoadedForRef.current = null
    setVariants([])
    setVariantsLoading(false)
  }, [modalOpen, form.listingId, setVariants, setVariantsLoading, variantsLoadedForRef])

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
  }, [
    modalOpen,
    step,
    form.listingId,
    form.enableVariants,
    setFormError,
    setVariants,
    setVariantsLoading,
    variantsLoadedForRef,
  ])

  useEffect(() => {
    if (!modalOpen) return
    if (!form.enableVariants) return
    if (!variants.length) return

    const def = variants.find((v) => v.isDefault) ?? variants[0]
    if (!def) return
    setForm((c) => ({ ...c, price: def.price }))
  }, [modalOpen, form.enableVariants, variants, setForm])

  useEffect(() => {
    void (async () => {
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
    })()
  }, [
    refreshKey,
    setDrafts,
    setManagerError,
    setManagerLoading,
    setPublished,
    setSellerLocation,
  ])

  useEffect(() => {
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
  }, [modalOpen, form.listingType, form.latitude, form.longitude, sellerLocation, setForm])

  useEffect(() => {
    if (!modalOpen) return
    if (!form.listingId) return
    if (!form.categoryId) return

    const derivedPath = buildCategoryPath(form.categoryId, byId)
    if (!derivedPath.length) return

    const samePath =
      derivedPath.length === form.categoryPath.length &&
      derivedPath.every((categoryId, index) => form.categoryPath[index] === categoryId)

    if (samePath) return

    setForm((current) => ({
      ...current,
      categoryPath: derivedPath,
      subcategoryId: derivedPath.length > 1 ? derivedPath[derivedPath.length - 1] : null,
    }))
  }, [modalOpen, form.listingId, form.categoryId, form.categoryPath, byId, setForm])
}
