'use server'

import { createClient } from '@/shared/database/supabase/server'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'
import { ROLES, type Role } from '@/domains/users/domain/roles'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { ListingModerationStatus } from '@/domains/logistics/domain/types'
import { notifySuperAdminsListingReviewRequested } from '@/shared/events/legacy-notifications/in-app-notifications'
import {
  getProductBaseForListingForm,
  listActiveProductBasesForSeller,
} from '@/domains/marketplace/product-base/application/queries/seller-product-base.queries'
import { searchProductBases } from '@/domains/marketplace/product-base/application/queries/search-product-bases.queries'
import {
  publicationTypeFromProductBaseType,
  resolveListingDbTypeFromProductBaseType,
} from '@/domains/marketplace/product-base/domain/product-base-listing-bridge'
import type { ProductBaseType } from '@/domains/marketplace/product-base/domain/product-base'
import { z } from 'zod'

type ListingAttributesPayload = Record<string, unknown>

function assertSellerOrAdmin(role: Role | null) {
  if (
    role !== ROLES.SUPER_ADMIN &&
    role !== ROLES.SELLER &&
    role !== ROLES.SELLER_ADMIN
  ) {
    throw new Error('Forbidden')
  }
}

export type ListingManagerRow = {
  id: string
  status: 'draft' | 'published'
  listingType: ListingType
  categoryId: string
  moderationStatus: ListingModerationStatus
  moderationReason: string | null
  productBaseId: string | null
  title: string | null
  description: string | null
  price: number | null
  stock: number | null
  condition: 'new' | 'used' | null
  characteristics: ListingAttributesPayload
  images: string[]
  latitude: number | null
  longitude: number | null
  createdAt: string
  isLegacyReadOnly: boolean
}

export type ListingVariantRow = {
  id: string
  listingId: string
  name: string
  sku: string
  price: number
  stock: number
  isDefault: boolean
  attributesJson: ListingAttributesPayload
  createdAt: string
}

async function getSellerContext() {
  const supabase = await createClient()

  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Unauthorized')

  const store = await getStoreByUserId(data.user.id)
  if (!store) throw new Error('Debés activar el modo vendedor antes de crear publicaciones.')

  const role = await getUserRoleByUserId(data.user.id)
  assertSellerOrAdmin(role)

  return { supabase, userId: data.user.id, store }
}

async function assertListingOwnership(supabase: Awaited<ReturnType<typeof createClient>>, storeId: string, listingId: string) {
  const { data: listingRow, error } = await supabase
    .from('listing')
    .select('id, store_id')
    .eq('id', listingId)
    .maybeSingle()

  if (error) throw error
  if (!listingRow) throw new Error('Listing not found.')

  const typedListingRow = listingRow as { store_id: string }
  if (typedListingRow.store_id !== storeId) throw new Error('Forbidden')
}

export async function getListingsManagerDataAction() {
  const { supabase, store } = await getSellerContext()

  const { data: rows, error } = await supabase
    .from('listing')
    .select('*')
    .eq('store_id', store.id)

  if (error) throw error

  const mapped: ListingManagerRow[] = (rows ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    status: row.status as 'draft' | 'published',
    listingType: row.listing_type as ListingType,
    categoryId: row.category_id as string,
    moderationStatus: (row.moderation_status as ListingModerationStatus) ?? 'pending',
    moderationReason: (row.moderation_reason as string | null) ?? null,
    productBaseId: (row.product_base_id as string | null) ?? null,
    title: (row.title as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    price: (row.price as number | null) ?? null,
    stock: (row.stock as number | null) ?? null,
    condition: (row.condition as 'new' | 'used' | null) ?? null,
    characteristics: (row.characteristics as ListingAttributesPayload) ?? {},
    images: Array.isArray(row.images) ? row.images.filter((item): item is string => typeof item === 'string') : [],
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    createdAt: row.created_at as string,
    isLegacyReadOnly: row.product_base_id == null,
  }))

  return {
    drafts: mapped.filter((l) => l.status === 'draft').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    published: mapped
      .filter((l) => l.status === 'published')
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    sellerLocation: {
      latitude: store.latitude,
      longitude: store.longitude,
    },
  }
}

export async function listActiveProductBasesForSellerAction(input: {
  categoryId: string
  subcategoryId?: string | null
}) {
  await getSellerContext()
  return listActiveProductBasesForSeller(input)
}

export async function getProductBaseForListingFormAction(productBaseId: string) {
  await getSellerContext()
  return getProductBaseForListingForm(productBaseId)
}

export async function searchProductBasesForSellerAction(input: {
  query: string
  listingType?: ListingType
  limit?: number
}) {
  await getSellerContext()
  return searchProductBases(input)
}

export async function createProductBaseDraftListingAction(input: {
  categoryId: string
  subcategoryId?: string | null
  productBaseId: string
}) {
  const { supabase, store } = await getSellerContext()
  const productBase = await getProductBaseForListingForm(input.productBaseId)

  if (!productBase) throw new Error('La plantilla seleccionada no está disponible.')
  if (productBase.categoryId !== input.categoryId) {
    throw new Error('La plantilla no corresponde a la categoría seleccionada.')
  }
  if ((productBase.subcategoryId ?? null) !== (input.subcategoryId ?? null)) {
    throw new Error('La plantilla no corresponde a la subcategoría seleccionada.')
  }

  const listingDbType = resolveListingDbTypeFromProductBaseType(productBase.type as ProductBaseType)

  const { data, error } = await supabase
    .from('listing')
    .insert({
      store_id: store.id,
      category_id: input.subcategoryId ?? input.categoryId,
      product_base_id: input.productBaseId,
      listing_type: listingDbType,
      title: productBase.name,
      price_mode: 'centralized',
      status: 'draft',
      characteristics: {},
      images: [],
      condition: 'new',
      ...(listingDbType === 'product' || listingDbType === 'dittobot'
        ? {
            latitude: store.latitude,
            longitude: store.longitude,
          }
        : {}),
    } as never)
    .select('id')
    .single()

  if (error) throw error
  const created = data as { id: string } | null
  if (!created?.id) throw new Error('Failed to create draft listing.')

  return {
    id: created.id,
    productBase,
    publicationType: publicationTypeFromProductBaseType(productBase.type as ProductBaseType),
  }
}

export async function createDraftListingAction(categoryId: string) {
  const { supabase, store } = await getSellerContext()

  const { data: categoryRow } = await supabase
    .from('category')
    .select('listing_type')
    .eq('id', categoryId)
    .maybeSingle()

  const categoryRowTyped = categoryRow as { listing_type: ListingManagerRow['listingType'] } | null

  if (!categoryRowTyped?.listing_type) {
    throw new Error('Invalid category.')
  }

  const { data, error } = await supabase
    .from('listing')
    .insert({
      store_id: store.id,
      category_id: categoryId,
      listing_type: categoryRowTyped.listing_type,
      status: 'draft',
      characteristics: {},
      ...(categoryRowTyped.listing_type === 'product'
        ? {
            latitude: store.latitude,
            longitude: store.longitude,
          }
        : {}),
    } as never)
    .select('*')
    .single()

  if (error) throw error

  const created = data as { id: string } | null
  if (!created?.id) throw new Error('Failed to create draft listing.')
  return { id: created.id }
}

export async function updateListingDraftAction(id: string, payload: Partial<{
  categoryId: string
  title: string
  description: string
  price: number
  stock: number
  condition: 'new' | 'used'
  characteristics: ListingAttributesPayload
  images: string[]
  latitude: number | null
  longitude: number | null
}>) {
  const { supabase, store } = await getSellerContext()

  const { categoryId, ...rest } = payload

  const { data: listingRow, error: listingError } = await supabase
    .from('listing')
    .select('id, store_id, product_base_id')
    .eq('id', id)
    .maybeSingle()

  if (listingError) throw listingError
  if (!listingRow) throw new Error('Listing not found.')

  const listingTyped = listingRow as { store_id: string; product_base_id: string | null }
  if (listingTyped.store_id !== store.id) throw new Error('Forbidden')

  let listing_typePatch: string | undefined
  if (categoryId && !listingTyped.product_base_id) {
    const { data } = await supabase
      .from('category')
      .select('listing_type')
      .eq('id', categoryId)
      .maybeSingle()
    const dataTyped = data as { listing_type: ListingManagerRow['listingType'] } | null
    listing_typePatch = dataTyped?.listing_type
  }

  const updatePayload: Record<string, unknown> = {
    ...(categoryId ? { category_id: categoryId } : {}),
    ...(listing_typePatch ? { listing_type: listing_typePatch } : {}),
    ...(rest as Record<string, unknown>),
  }

  if (listingTyped.product_base_id) {
    const productBase = await getProductBaseForListingForm(listingTyped.product_base_id)
    if (productBase) {
      updatePayload.title = productBase.name
    }
  }

  const { error } = await supabase
    .from('listing')
    .update(updatePayload as never)
    .eq('id', id)

  if (error) throw error
}

export async function publishListingAction(id: string, payload: {
  price: number
  simpleSku?: string | null
}) {
  const { supabase } = await getSellerContext()

  // Fetch legacy listing fields needed to create a default variant.
  // (Legacy drafts store dynamic fields in `characteristics`, and base stock/price separately.)
  type LegacyListingRow = {
    id: string
    title: string | null
    stock: number | null
    characteristics: ListingAttributesPayload | null
    store_id: string
  }

  const { data: legacyListing, error: legacyError } = await supabase
    .from('listing')
    .select('id, title, stock, characteristics, store_id')
    .eq('id', id)
    .maybeSingle()

  if (legacyError) throw legacyError
  if (!legacyListing) throw new Error('Listing not found.')

  const legacy = legacyListing as LegacyListingRow

  // Ensure we don't create variants for a listing outside this seller context.
  // `store.id` = user.id (per migrations), so compare against auth.uid().
  const { data: authUser } = await supabase.auth.getUser()
  if (!authUser?.user) throw new Error('Unauthorized')
  await assertListingOwnership(supabase, legacy.store_id, id)

  const { error: variantCountError } = await supabase
    .from('listing_variant')
    .select('id')
    .eq('listing_id', id)
    .limit(1)

  if (variantCountError) throw variantCountError

  // Create default variant only when none exist.
  // Note: we rely on the fact that this publish flow is the first write of variants
  // for legacy listings; once the new UI is in place, it will explicitly manage variants.
  const { data: existingVariantRows } = await supabase
    .from('listing_variant')
    .select('id')
    .eq('listing_id', id)
    .limit(1)

  if (!existingVariantRows?.length) {
    const sku = payload.simpleSku?.trim() ? payload.simpleSku.trim() : `legacy-default-${id}`
    const name = `Default variant`

    const { error: insertVariantError } = await supabase
      .from('listing_variant')
      .insert({
        listing_id: id,
        name,
        sku,
        price: payload.price,
        stock: legacy.stock ?? 0,
        is_default: true,
        attributes_json: legacy.characteristics ?? {},
      } as never)

    if (insertVariantError) throw insertVariantError
  }

  // Ensure exactly one default variant exists.
  const { data: existingDefaultRows } = await supabase
    .from('listing_variant')
    .select('id')
    .eq('listing_id', id)
    .eq('is_default', true)
    .limit(1)

  if (!existingDefaultRows?.length) {
    await supabase.from('listing_variant').update({ is_default: false } as never).eq('listing_id', id)

    const { data: firstVariantRows, error: firstVariantError } = await supabase
      .from('listing_variant')
      .select('id')
      .eq('listing_id', id)
      .order('created_at', { ascending: true })
      .limit(1)

    if (firstVariantError) throw firstVariantError

    const typedFirstVariantRows = firstVariantRows as Array<{ id: string }> | null
    const firstId = typedFirstVariantRows?.[0]?.id
    if (firstId) {
      const { error: makeDefaultError } = await supabase
        .from('listing_variant')
        .update({ is_default: true } as never)
        .eq('id', firstId)

      if (makeDefaultError) throw makeDefaultError
    }
  }

  const { error } = await supabase
    .from('listing')
    .update({
      status: 'published',
      // Keep legacy fields updated for now; future commerce should use listing variants.
      price: payload.price,
    } as never)
    .eq('id', id)

  if (error) throw error

  await notifySuperAdminsListingReviewRequested({
    listingId: id,
    listingTitle: legacy.title?.trim() || 'Nuevo listing',
  })
}

const variantAttributesSchema = z
  .record(z.unknown())
  .refine((obj) => Object.keys(obj).every((k) => k.trim().length > 0), 'Invalid attribute keys')

const variantUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  isDefault: z.boolean().optional(),
  attributesJson: variantAttributesSchema.optional().default({}),
})

export async function getListingVariantsAction(listingId: string): Promise<ListingVariantRow[]> {
  const { supabase, store } = await getSellerContext()
  await assertListingOwnership(supabase, store.id, listingId)

  const { data, error } = await supabase
    .from('listing_variant')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    listingId: row.listing_id as string,
    name: (row.name as string | undefined) ?? '',
    sku: row.sku as string,
    price: Number(row.price ?? 0),
    stock: (row.stock as number | undefined) ?? 0,
    isDefault: Boolean(row.is_default),
    attributesJson: (row.attributes_json ?? {}) as ListingAttributesPayload,
    createdAt: row.created_at as string,
  }))
}

export async function upsertListingVariantsAction(
  listingId: string,
  variants: Array<z.infer<typeof variantUpsertSchema>>
): Promise<void> {
  const { supabase, store } = await getSellerContext()
  await assertListingOwnership(supabase, store.id, listingId)

  const parsed = z.array(variantUpsertSchema).safeParse(variants)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid variants payload')

  const normalized = parsed.data

  // Delete variants removed from the incoming payload.
  const incomingIds = normalized.map((v) => v.id).filter((id): id is string => Boolean(id))
  const { data: existingRows, error: existingError } = await supabase
    .from('listing_variant')
    .select('id')
    .eq('listing_id', listingId)

  if (existingError) throw existingError

  const existingIds = (existingRows ?? []).map((r: Record<string, unknown>) => r.id as string)
  const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id))
  if (idsToDelete.length) {
    const { error: deleteError } = await supabase
      .from('listing_variant')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) throw deleteError
  }

  // Update existing by `id`, insert new when `id` is missing.
  for (const v of normalized) {
    if (v.id) {
      const { error } = await supabase.from('listing_variant').update({
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        is_default: v.isDefault ?? false,
        attributes_json: v.attributesJson ?? {},
      } as never).eq('id', v.id).eq('listing_id', listingId)

      if (error) throw error
    } else {
      const { error } = await supabase.from('listing_variant').insert({
        listing_id: listingId,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        is_default: v.isDefault ?? false,
        attributes_json: v.attributesJson ?? {},
      } as never)

      if (error) throw error
    }
  }
}

export async function deleteListingAction(id: string) {
  const { supabase } = await getSellerContext()

  const { error } = await supabase.from('listing').delete().eq('id', id)
  if (error) throw error
}

export async function setListingDraftStatusAction(id: string): Promise<void> {
  const { supabase } = await getSellerContext()
  const { error } = await supabase
    .from('listing')
    .update({ status: 'draft' } as never)
    .eq('id', id)

  if (error) throw error
}

