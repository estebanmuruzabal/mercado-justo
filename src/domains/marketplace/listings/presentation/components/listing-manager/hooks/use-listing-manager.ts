'use client'

import { useMemo, useRef, useState } from 'react'

import {
  createProductBaseDraftListingAction,
  deleteListingAction,
  publishListingAction,
  setListingDraftStatusAction,
  upsertListingVariantsAction,
  updateListingDraftAction,
  getProductBaseForListingFormAction,
  type ListingManagerRow,
} from '@/domains/marketplace/listings/application/actions/listing-manager.actions'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { CharacteristicMap, TemplateDef } from '@/domains/marketplace/listings/domain/product'
import type { ProductBaseSearchResultDto } from '@/domains/marketplace/product-base/application/dto/product-base-search.dto'
import { isProductBaseCompatibleWithListingType } from '@/domains/marketplace/product-base/domain/product-base-listing-type-filter'
import {
  attachProductBaseToIdentificationImage,
  clearIdentificationImageStorage,
  saveIdentificationImage,
} from '@/domains/marketplace/listings/presentation/utils/listing-identification-image.storage'
import {
  revokePendingListingImagePreviews,
  type PendingListingImage,
} from '@/domains/marketplace/listings/presentation/utils/pending-listing-image'
import type { VariantEditorValue } from '@/domains/marketplace/listings/presentation/components/variants/VariantCard'

import { BASE_TEMPLATE, EMPTY_FORM } from '../constants'
import type { CategoryRow, DraftFormState, ModalStep } from '../types'
import { buildCategoryPath, productBaseCategoryPath } from '../utils/category.utils'
import {
  cleanupIdentificationSession,
  resolvePendingIdentificationImages,
  uploadPendingListingImages,
} from '../utils/identification-session'
import { mergeListingTemplate } from '../utils/listing-template.utils'
import { useListingManagerEffects } from './use-listing-manager-effects'

function listingSupportsLocation(listingType: ListingType | null): boolean {
  return listingType === 'product' || listingType === 'dittobot'
}

function validateVariantsForSubmit(
  enableVariants: boolean,
  variants: VariantEditorValue[],
  form: DraftFormState,
): string | null {
  if (enableVariants) {
    if (variants.length < 1) return 'Activaste variantes, pero no agregaste ninguna variante.'
    if (variants.some((v) => !v.name.trim() || v.price <= 0 || v.stock < 0)) {
      return 'Revisá tus variantes: cada variante debe tener nombre, precio y stock.'
    }
    return null
  }

  if (form.simplePrice == null) return 'Definí el precio para el modo simple.'
  if (form.stock < 0) return 'Definí un stock válido.'
  return null
}

export function useListingManager() {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const [managerLoading, setManagerLoading] = useState(true)
  const [managerError, setManagerError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<ListingManagerRow[]>([])
  const [published, setPublished] = useState<ListingManagerRow[]>([])
  const [sellerLocation, setSellerLocation] = useState<{ latitude: number | null; longitude: number | null } | null>(
    null,
  )
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
  const template = useMemo(() => mergeListingTemplate(listingTemplate, BASE_TEMPLATE), [listingTemplate])

  useListingManagerEffects({
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
  })

  function openCreateModalForListingType(listingType: ListingType) {
    setForm({
      ...EMPTY_FORM,
      status: 'draft',
      listingType,
      latitude: listingType === 'product' ? (sellerLocation?.latitude ?? null) : null,
      longitude: listingType === 'product' ? (sellerLocation?.longitude ?? null) : null,
    })
    setStep(1)
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(row: ListingManagerRow) {
    const characteristics = (row.characteristics ?? {}) as CharacteristicMap
    const categoryPath = buildCategoryPath(row.categoryId, byId)

    setForm({
      listingId: row.id,
      listingType: row.listingType,
      categoryId: row.categoryId,
      subcategoryId: null,
      categoryPath,
      productBaseId: row.productBaseId,
      productBase: null,
      selectedProductBase: null,
      title: (row.title ?? '') as string,
      description: (row.description ?? '') as string,
      condition: (row.condition ?? 'new') as 'new' | 'used',
      stock: (row.stock ?? 0) as number,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      characteristics,
      images: row.images ?? [],
      pendingListingImages: [],
      enableVariants: false,
      simplePrice: row.price ?? null,
      simpleSku: null,
      price: row.price ?? null,
      status: row.status,
    })
    setStep(2)
    setFormError(null)
    setModalOpen(true)
  }

  function handleProductBaseSelect(result: ProductBaseSearchResultDto) {
    if (form.listingType && !isProductBaseCompatibleWithListingType(result.type, form.listingType)) {
      setFormError('Esta plantilla no coincide con el tipo de publicación elegido.')
      return
    }

    const isProductBaseChange = Boolean(form.productBaseId && form.productBaseId !== result.id)
    if (isProductBaseChange) {
      cleanupIdentificationSession(form.pendingListingImages)
    } else {
      attachProductBaseToIdentificationImage(result.id)
    }

    const leafCategoryId = result.subcategoryId ?? result.categoryId
    const categoryPath = productBaseCategoryPath(result.categoryId, result.subcategoryId)

    setFormError(null)
    setForm((current) => ({
      ...current,
      productBaseId: result.id,
      categoryId: leafCategoryId,
      subcategoryId: result.subcategoryId,
      categoryPath,
      title: result.name,
      pendingListingImages: isProductBaseChange ? [] : current.pendingListingImages,
      selectedProductBase: {
        id: result.id,
        name: result.name,
        image: result.image,
        taxonomyPath: result.taxonomyPath,
        category: result.category,
        subcategory: result.subcategory,
        confidence: result.confidence,
      },
    }))
  }

  async function handleIdentificationImageCaptured(file: File) {
    try {
      await saveIdentificationImage(file, form.productBaseId)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la imagen temporal.')
    }
  }

  function handlePendingImagesChange(pendingListingImages: PendingListingImage[]) {
    setForm((current) => {
      const removed = current.pendingListingImages.filter(
        (item) => !pendingListingImages.some((next) => next.id === item.id),
      )
      revokePendingListingImagePreviews(removed)
      if (pendingListingImages.length === 0) {
        clearIdentificationImageStorage()
      }
      return { ...current, pendingListingImages }
    })
  }

  function handleModalOpenChange(open: boolean) {
    if (!open) {
      cleanupIdentificationSession(form.pendingListingImages)
    }
    setModalOpen(open)
  }

  async function handleStep1Next() {
    if (!form.listingType || !form.productBaseId) return

    setFormBusy(true)
    setFormError(null)
    try {
      let productBase = await getProductBaseForListingFormAction(form.productBaseId)
      if (!productBase) {
        setFormError('La plantilla seleccionada no está disponible.')
        return
      }

      const leafCategoryId = productBase.subcategoryId ?? productBase.categoryId
      const categoryPath = productBaseCategoryPath(productBase.categoryId, productBase.subcategoryId)

      if (!form.listingId) {
        const { id, productBase: createdProductBase, publicationType } = await createProductBaseDraftListingAction({
          categoryId: productBase.categoryId,
          subcategoryId: productBase.subcategoryId,
          productBaseId: form.productBaseId,
        })
        productBase = createdProductBase
        setForm((current) => ({
          ...current,
          listingId: id,
          productBase: createdProductBase,
          listingType: publicationType as ListingType,
          categoryId: leafCategoryId,
          subcategoryId: createdProductBase.subcategoryId,
          categoryPath,
          status: 'draft',
        }))
      }

      const pendingListingImages = await resolvePendingIdentificationImages(form.productBaseId, productBase)

      revokePendingListingImagePreviews(form.pendingListingImages)
      if (pendingListingImages.length > 0) {
        clearIdentificationImageStorage()
      }

      setForm((current) => ({
        ...current,
        productBase,
        categoryId: leafCategoryId,
        subcategoryId: productBase.subcategoryId,
        categoryPath,
        title: productBase.name,
        pendingListingImages,
        characteristics: {
          ...Object.fromEntries(
            productBase.attributes
              .filter((attr) => attr.defaultValue !== null && attr.defaultValue !== undefined)
              .map((attr) => [attr.key, attr.defaultValue]),
          ),
          ...current.characteristics,
        } as CharacteristicMap,
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
        price: form.enableVariants ? undefined : (form.simplePrice ?? undefined),
        characteristics: form.characteristics,
        images: form.images,
        ...(listingSupportsLocation(form.listingType)
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

    const publishPrice = form.enableVariants ? form.price : form.simplePrice
    const validationError = validateVariantsForSubmit(form.enableVariants, variants, form)
    if (validationError) {
      setFormError(validationError)
      return
    }
    if (publishPrice == null) {
      setFormError('Falta definir el precio.')
      return
    }

    setFormBusy(true)
    setFormError(null)
    try {
      let finalImages = form.images
      if (form.pendingListingImages.length > 0) {
        const uploaded = await uploadPendingListingImages(form.listingId, form.pendingListingImages)
        finalImages = [...form.images, ...uploaded]
        cleanupIdentificationSession(form.pendingListingImages)
        setForm((current) => ({ ...current, images: finalImages, pendingListingImages: [] }))
      }

      await updateListingDraftAction(form.listingId, {
        categoryId: form.categoryId ?? undefined,
        title: form.title,
        description: form.description,
        condition: form.condition,
        stock: form.enableVariants ? 0 : form.stock,
        price: form.enableVariants ? undefined : (form.simplePrice ?? undefined),
        characteristics: form.characteristics,
        images: finalImages,
        ...(listingSupportsLocation(form.listingType)
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
          })),
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

    const validationError = validateVariantsForSubmit(form.enableVariants, variants, form)
    if (validationError) {
      setFormError(validationError)
      return
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
        price: form.enableVariants ? undefined : (form.simplePrice ?? undefined),
        characteristics: form.characteristics,
        images: form.images,
        ...(listingSupportsLocation(form.listingType)
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
          })),
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
      setFormError(err instanceof Error ? err.message : 'No se pudo eliminar.')
    } finally {
      setDeleteBusy(false)
    }
  }

  return {
    categoriesLoading,
    categoriesError,
    managerLoading,
    managerError,
    drafts,
    published,
    sellerLocation,
    modalOpen,
    step,
    setStep,
    form,
    setForm,
    formBusy,
    formError,
    template,
    byId,
    variants,
    variantsLoading,
    setVariants,
    deleteCandidate,
    setDeleteCandidate,
    deleteBusy,
    openCreateModalForListingType,
    openEditModal,
    handleProductBaseSelect,
    handleIdentificationImageCaptured,
    handlePendingImagesChange,
    handleModalOpenChange,
    handleStep1Next,
    handleStep2Next,
    handleSaveDraft,
    handlePublish,
    handleDeleteConfirmed,
  }
}
