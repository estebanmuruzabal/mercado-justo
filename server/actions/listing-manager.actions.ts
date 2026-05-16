'use server'

import { createClient } from '@/lib/supabase/server'
import { getStoreByUserId } from '@/server/services/store.service'
import { getUserRoleByUserId } from '@/server/queries/user.queries'
import { ROLES, type Role } from '@/lib/roles'

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
  listingType: 'product' | 'service' | 'property'
  categoryId: string
  title: string | null
  description: string | null
  price: number | null
  stock: number | null
  condition: 'new' | 'used' | null
  characteristics: ListingAttributesPayload
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

export async function getListingsManagerDataAction() {
  const { supabase, store } = await getSellerContext()

  const { data: rows, error } = await supabase
    .from('listing')
    .select('*')
    .eq('store_id', store.id)

  if (error) throw error

  const mapped: ListingManagerRow[] = (rows ?? []).map((row: any) => ({
    id: row.id,
    status: row.status as 'draft' | 'published',
    listingType: row.listing_type as 'product' | 'service' | 'property',
    categoryId: row.category_id,
    title: row.title ?? null,
    description: row.description ?? null,
    price: row.price ?? null,
    stock: row.stock ?? null,
    condition: row.condition ?? null,
    characteristics: row.characteristics ?? {},
    createdAt: row.created_at,
  }))

  return {
    drafts: mapped.filter((l) => l.status === 'draft').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    published: mapped
      .filter((l) => l.status === 'published')
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
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
}>) {
  const { supabase } = await getSellerContext()

  const { categoryId, ...rest } = payload

  let listing_typePatch: string | undefined
  if (categoryId) {
    const { data } = await supabase
      .from('category')
      .select('listing_type')
      .eq('id', categoryId)
      .maybeSingle()
    const dataTyped = data as { listing_type: ListingManagerRow['listingType'] } | null
    listing_typePatch = dataTyped?.listing_type
  }

  const { error } = await supabase
    .from('listing')
    .update(
      {
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(listing_typePatch ? { listing_type: listing_typePatch } : {}),
        ...(rest as any),
      } as never
    )
    .eq('id', id)

  if (error) throw error
}

export async function publishListingAction(id: string, payload: {
  price: number
}) {
  const { supabase } = await getSellerContext()

  const { error } = await supabase
    .from('listing')
    .update({
      status: 'published',
      price: payload.price,
    } as never)
    .eq('id', id)

  if (error) throw error
}

export async function deleteListingAction(id: string) {
  const { supabase } = await getSellerContext()

  const { error } = await supabase.from('listing').delete().eq('id', id)
  if (error) throw error
}

