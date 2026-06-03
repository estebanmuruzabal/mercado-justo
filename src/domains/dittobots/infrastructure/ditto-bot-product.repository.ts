import type { createAdminClient } from '@/shared/database/admin-client'

import { DITTO_BOT_CATALOG_LISTING_STOCK } from '../domain/ditto-bot-product-stock'

type AdminClient = ReturnType<typeof createAdminClient>

export type OfficialDittoBotVendor = {
  id: string
  name: string
  slug: string
  latitude: number | null
  longitude: number | null
}

export async function findOfficialDittoBotVendor(
  admin: AdminClient,
): Promise<OfficialDittoBotVendor | null> {
  const { data, error } = await admin
    .from('store')
    .select('id, name, slug, latitude, longitude')
    .eq('is_official_ditto_bot_vendor', true)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as {
    id: string
    name: string
    slug: string
    latitude: number | null
    longitude: number | null
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    latitude: row.latitude,
    longitude: row.longitude,
  }
}

export type DittoBotProductRow = {
  id: string
  title: string
  description: string | null
  price: number | null
  stock: number
  categoryId: string
  categoryName: string | null
  status: string
  moderationStatus: string
  tags: string[]
  image: string | null
  images: string[]
  createdAt: string
}

type ListingRow = {
  id: string
  title: string | null
  description: string | null
  price: number | null
  stock: number
  category_id: string
  status: string
  moderation_status: string
  characteristics: { tags?: unknown; image?: unknown; images?: unknown } | null
  created_at: string
  category?: { name: string | null } | null
}

function parseProductImages(characteristics: ListingRow['characteristics']): {
  image: string | null
  images: string[]
} {
  const image =
    typeof characteristics?.image === 'string' && characteristics.image.trim()
      ? characteristics.image.trim()
      : null
  const imagesRaw = characteristics?.images
  const images = Array.isArray(imagesRaw)
    ? imagesRaw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
  return { image, images }
}

function mapProductRow(row: ListingRow): DittoBotProductRow {
  const tagsRaw = row.characteristics?.tags
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.filter((t): t is string => typeof t === 'string')
    : []
  const { image, images } = parseProductImages(row.characteristics)

  return {
    id: row.id,
    title: row.title ?? '',
    description: row.description,
    price: row.price,
    stock: row.stock,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? null,
    status: row.status,
    moderationStatus: row.moderation_status,
    tags,
    image,
    images,
    createdAt: row.created_at,
  }
}

export async function listDittoBotProductsAdmin(admin: AdminClient): Promise<DittoBotProductRow[]> {
  const official = await findOfficialDittoBotVendor(admin)
  if (!official) return []

  const { data, error } = await admin
    .from('listing')
    .select(
      'id, title, description, price, stock, category_id, status, moderation_status, characteristics, created_at, category(name)',
    )
    .eq('store_id', official.id)
    .eq('listing_type', 'dittobot')
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as ListingRow[]).map(mapProductRow)
}

export async function getDittoBotProductByIdAdmin(
  admin: AdminClient,
  productId: string,
): Promise<DittoBotProductRow | null> {
  const official = await findOfficialDittoBotVendor(admin)
  if (!official) return null

  const { data, error } = await admin
    .from('listing')
    .select(
      'id, title, description, price, stock, category_id, status, moderation_status, characteristics, created_at, category(name)',
    )
    .eq('id', productId)
    .eq('store_id', official.id)
    .eq('listing_type', 'dittobot')
    .maybeSingle()

  if (error) throw error
  return data ? mapProductRow(data as ListingRow) : null
}

export type CreateDittoBotProductRepoInput = {
  storeId: string
  title: string
  description: string
  categoryId: string
  price: number
  characteristics: Record<string, unknown>
  latitude: number | null
  longitude: number | null
  actorUserId: string
}

export async function insertDittoBotProduct(
  admin: AdminClient,
  input: CreateDittoBotProductRepoInput,
): Promise<string> {
  const { data, error } = await admin
    .from('listing')
    .insert({
      store_id: input.storeId,
      title: input.title,
      description: input.description,
      category_id: input.categoryId,
      price: input.price,
      stock: DITTO_BOT_CATALOG_LISTING_STOCK,
      condition: 'new',
      listing_type: 'dittobot',
      status: 'published',
      moderation_status: 'approved',
      moderated_by: input.actorUserId,
      moderated_at: new Date().toISOString(),
      price_mode: 'centralized',
      characteristics: input.characteristics,
      latitude: input.latitude,
      longitude: input.longitude,
    } as never)
    .select('id')
    .single()

  if (error) throw error
  const listingId = (data as { id: string }).id

  const { error: variantError } = await admin.from('listing_variant').insert({
    listing_id: listingId,
    name: 'Default variant',
    sku: `dtb-${listingId.slice(0, 8)}`,
    price: input.price,
    stock: DITTO_BOT_CATALOG_LISTING_STOCK,
    is_default: true,
    attributes_json: input.characteristics,
  } as never)

  if (variantError) throw variantError

  return listingId
}

export type UpdateDittoBotProductRepoInput = {
  title?: string
  description?: string
  categoryId?: string
  price?: number
  characteristics?: Record<string, unknown>
}

export async function updateDittoBotProduct(
  admin: AdminClient,
  productId: string,
  input: UpdateDittoBotProductRepoInput,
): Promise<void> {
  const updatePayload: Record<string, unknown> = {}
  if (input.title !== undefined) updatePayload.title = input.title
  if (input.description !== undefined) updatePayload.description = input.description
  if (input.categoryId !== undefined) updatePayload.category_id = input.categoryId
  if (input.price !== undefined) updatePayload.price = input.price
  if (input.characteristics !== undefined) updatePayload.characteristics = input.characteristics
  updatePayload.stock = DITTO_BOT_CATALOG_LISTING_STOCK

  const { error } = await admin.from('listing').update(updatePayload as never).eq('id', productId)
  if (error) throw error

  const variantUpdate: Record<string, unknown> = {
    stock: DITTO_BOT_CATALOG_LISTING_STOCK,
  }
  if (input.price !== undefined) variantUpdate.price = input.price
  if (input.characteristics !== undefined) {
    variantUpdate.attributes_json = input.characteristics
  }

  const { error: variantError } = await admin
    .from('listing_variant')
    .update(variantUpdate as never)
    .eq('listing_id', productId)
    .eq('is_default', true)

  if (variantError) throw variantError
}

export async function deactivateDittoBotProduct(
  admin: AdminClient,
  productId: string,
): Promise<void> {
  const { error } = await admin
    .from('listing')
    .update({
      status: 'draft',
      moderation_status: 'hidden',
      moderation_reason: 'DittoBot product deactivated by admin',
    } as never)
    .eq('id', productId)

  if (error) throw error
}

export type RegionalVendorRow = {
  id: string
  name: string
  slug: string
  canSellDittoBots: boolean
}

export async function listRegionalVendorsAdmin(admin: AdminClient): Promise<RegionalVendorRow[]> {
  const { data, error } = await admin
    .from('store')
    .select('id, name, slug, can_sell_ditto_bots')
    .eq('is_official_ditto_bot_vendor', false)
    .eq('can_sell_ditto_bots', true)
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) throw error
  return ((data ?? []) as Array<{
    id: string
    name: string
    slug: string
    can_sell_ditto_bots: boolean
  }>).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    canSellDittoBots: row.can_sell_ditto_bots,
  }))
}

export type RegionalVendorManageRow = RegionalVendorRow & {
  isOfficial: boolean
}

export async function listRegionalVendorsForDittoSellerManage(
  admin: AdminClient,
): Promise<RegionalVendorManageRow[]> {
  const { data, error } = await admin
    .from('store')
    .select('id, name, slug, can_sell_ditto_bots, is_official_ditto_bot_vendor')
    .eq('is_official_ditto_bot_vendor', false)
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) throw error

  return ((data ?? []) as Array<{
    id: string
    name: string
    slug: string
    can_sell_ditto_bots: boolean
    is_official_ditto_bot_vendor: boolean
  }>).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    canSellDittoBots: row.can_sell_ditto_bots,
    isOfficial: row.is_official_ditto_bot_vendor,
  }))
}

export async function setVendorDittoSeller(
  admin: AdminClient,
  vendorId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await admin
    .from('store')
    .update({ can_sell_ditto_bots: enabled } as never)
    .eq('id', vendorId)
    .eq('is_official_ditto_bot_vendor', false)

  if (error) throw error
}

export async function getVendorByIdAdmin(
  admin: AdminClient,
  vendorId: string,
): Promise<(RegionalVendorRow & { isOfficial: boolean }) | null> {
  const { data, error } = await admin
    .from('store')
    .select('id, name, slug, is_official_ditto_bot_vendor, can_sell_ditto_bots')
    .eq('id', vendorId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as {
    id: string
    name: string
    slug: string
    is_official_ditto_bot_vendor: boolean
    can_sell_ditto_bots: boolean
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isOfficial: row.is_official_ditto_bot_vendor,
    canSellDittoBots: row.can_sell_ditto_bots,
  }
}
