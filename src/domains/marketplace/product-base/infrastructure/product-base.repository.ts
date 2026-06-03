import type { createAdminClient } from '@/shared/database/admin-client'

import type { ProductBaseImageStrategy, ProductBaseStatus, ProductBaseType } from '../domain/product-base'
import type { ProductBaseAttributeInput } from '../domain/product-base-attribute'
import {
  mapProductBaseAdminRow,
  mapProductBaseAttributeRow,
  mapProductBaseRow,
  type ProductBaseAdminRow,
  type ProductBaseAttributeRow,
  type ProductBaseRow,
} from './mappers/product-base.mapper'

type AdminClient = ReturnType<typeof createAdminClient>

const BASE_SELECT =
  'id, name, slug, description, category_id, subcategory_id, type, status, base_image_url, image_strategy, created_at, updated_at'

const BASE_ADMIN_SELECT = `${BASE_SELECT}, category:category!product_base_category_id_fkey(name), subcategory:category!product_base_subcategory_id_fkey(name)`

const ATTRIBUTE_SELECT =
  'id, product_base_id, key, label, description, type, required, default_value, placeholder, options, validation, sort_order, is_visible, is_filterable, is_searchable, is_variant_dimension, allow_variant_pricing, score_contribution, created_at, updated_at'

export type ProductBaseFilters = {
  search?: string
  type?: ProductBaseType
  status?: ProductBaseStatus
  categoryId?: string
}

export type CreateProductBaseRepoInput = {
  name: string
  slug: string
  description?: string | null
  categoryId: string
  subcategoryId?: string | null
  type: ProductBaseType
  status?: ProductBaseStatus
  baseImageUrl?: string | null
  imageStrategy: ProductBaseImageStrategy
  attributes: ProductBaseAttributeInput[]
}

export type UpdateProductBaseRepoInput = Partial<
  Omit<CreateProductBaseRepoInput, 'attributes' | 'status'>
> & {
  status?: ProductBaseStatus
  attributes?: ProductBaseAttributeInput[]
}

function attributeInsertPayload(productBaseId: string, attr: ProductBaseAttributeInput, index: number) {
  return {
    product_base_id: productBaseId,
    key: attr.key.trim(),
    label: attr.label.trim(),
    description: attr.description?.trim() ?? null,
    type: attr.type,
    required: attr.required,
    default_value: attr.defaultValue ?? null,
    placeholder: attr.placeholder?.trim() ?? null,
    options: attr.options ?? null,
    validation: attr.validation ?? null,
    sort_order: attr.sortOrder ?? index,
    is_visible: attr.isVisible,
    is_filterable: attr.isFilterable,
    is_searchable: attr.isSearchable,
    is_variant_dimension: attr.isVariantDimension,
    allow_variant_pricing: attr.allowVariantPricing,
    score_contribution: attr.scoreContribution ?? null,
  }
}

export async function listProductBasesAdmin(
  admin: AdminClient,
  filters: ProductBaseFilters = {},
): Promise<ProductBaseAdminRow[]> {
  let query = admin
    .from('product_base')
    .select(BASE_ADMIN_SELECT)
    .order('updated_at', { ascending: false })

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`
    query = query.or(`name.ilike.${term},slug.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as ProductBaseRow[]).map(mapProductBaseAdminRow)
}

export async function getProductBaseByIdAdmin(
  admin: AdminClient,
  id: string,
): Promise<(ProductBaseAdminRow & { attributes: ReturnType<typeof mapProductBaseAttributeRow>[] }) | null> {
  const { data: baseRow, error: baseError } = await admin
    .from('product_base')
    .select(BASE_ADMIN_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (baseError) throw baseError
  if (!baseRow) return null

  const { data: attributeRows, error: attrError } = await admin
    .from('product_base_attribute')
    .select(ATTRIBUTE_SELECT)
    .eq('product_base_id', id)
    .order('sort_order', { ascending: true })

  if (attrError) throw attrError

  return {
    ...mapProductBaseAdminRow(baseRow as ProductBaseRow),
    attributes: ((attributeRows ?? []) as ProductBaseAttributeRow[]).map(mapProductBaseAttributeRow),
  }
}

export async function slugExistsAdmin(admin: AdminClient, slug: string, excludeId?: string): Promise<boolean> {
  let query = admin.from('product_base').select('id').eq('slug', slug)
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function insertProductBaseAdmin(
  admin: AdminClient,
  input: CreateProductBaseRepoInput,
): Promise<string> {
  const { data, error } = await admin
    .from('product_base')
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() ?? null,
      category_id: input.categoryId,
      subcategory_id: input.subcategoryId ?? null,
      type: input.type,
      status: input.status ?? 'DRAFT',
      base_image_url: input.baseImageUrl?.trim() || null,
      image_strategy: input.imageStrategy,
    } as never)
    .select('id')
    .single()

  if (error) throw error
  const productBaseId = (data as { id: string }).id

  if (input.attributes.length > 0) {
    const { error: attrError } = await admin.from('product_base_attribute').insert(
      input.attributes.map((attr, index) => attributeInsertPayload(productBaseId, attr, index)) as never[],
    )
    if (attrError) throw attrError
  }

  return productBaseId
}

export async function updateProductBaseAdmin(
  admin: AdminClient,
  id: string,
  input: UpdateProductBaseRepoInput,
): Promise<void> {
  const updatePayload: Record<string, unknown> = {}
  if (input.name !== undefined) updatePayload.name = input.name.trim()
  if (input.slug !== undefined) updatePayload.slug = input.slug.trim()
  if (input.description !== undefined) updatePayload.description = input.description?.trim() ?? null
  if (input.categoryId !== undefined) updatePayload.category_id = input.categoryId
  if (input.subcategoryId !== undefined) updatePayload.subcategory_id = input.subcategoryId
  if (input.type !== undefined) updatePayload.type = input.type
  if (input.status !== undefined) updatePayload.status = input.status
  if (input.baseImageUrl !== undefined) updatePayload.base_image_url = input.baseImageUrl?.trim() || null
  if (input.imageStrategy !== undefined) updatePayload.image_strategy = input.imageStrategy

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await admin.from('product_base').update(updatePayload as never).eq('id', id)
    if (error) throw error
  }

  if (input.attributes !== undefined) {
    const { error: deleteError } = await admin.from('product_base_attribute').delete().eq('product_base_id', id)
    if (deleteError) throw deleteError

    if (input.attributes.length > 0) {
      const { error: insertError } = await admin.from('product_base_attribute').insert(
        input.attributes.map((attr, index) => attributeInsertPayload(id, attr, index)) as never[],
      )
      if (insertError) throw insertError
    }
  }
}

export async function deleteProductBaseAdmin(admin: AdminClient, id: string): Promise<void> {
  const { error } = await admin.from('product_base').delete().eq('id', id)
  if (error) throw error
}

export async function duplicateProductBaseAdmin(
  admin: AdminClient,
  sourceId: string,
  newSlug: string,
): Promise<string> {
  const source = await getProductBaseByIdAdmin(admin, sourceId)
  if (!source) throw new Error('Product Base no encontrado.')

  return insertProductBaseAdmin(admin, {
    name: `${source.name} (copia)`,
    slug: newSlug,
    description: source.description,
    categoryId: source.categoryId,
    subcategoryId: source.subcategoryId,
    type: source.type,
    status: 'DRAFT',
    baseImageUrl: source.baseImageUrl,
    imageStrategy: source.imageStrategy,
    attributes: source.attributes.map(
      ({
        key,
        label,
        description,
        type,
        required,
        defaultValue,
        placeholder,
        options,
        validation,
        sortOrder,
        isVisible,
        isFilterable,
        isSearchable,
        isVariantDimension,
        allowVariantPricing,
        scoreContribution,
      }) => ({
        key,
        label,
        description,
        type,
        required,
        defaultValue,
        placeholder,
        options,
        validation,
        sortOrder,
        isVisible,
        isFilterable,
        isSearchable,
        isVariantDimension,
        allowVariantPricing,
        scoreContribution,
      }),
    ),
  })
}

export { mapProductBaseRow }
