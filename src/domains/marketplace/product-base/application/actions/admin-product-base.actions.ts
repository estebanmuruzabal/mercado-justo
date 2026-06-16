'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { listCategoriesForAdmin } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import { assertSuperAdmin } from '@/shared/auth/guards/require-staff'
import { createAdminClient } from '@/shared/database/admin-client'
import { withAudit } from '@/shared/database/admin-audit'
import { ADMIN_CATEGORIES_PATH, ADMIN_PRODUCT_BASES_PATH, HOME_PATH } from '@/shared/routing/routes'

import {
  PRODUCT_BASE_IMAGE_STRATEGIES,
  PRODUCT_BASE_STATUSES,
  PRODUCT_BASE_TYPES,
  slugifyProductBaseName,
} from '../../domain/product-base'
import { PRODUCT_BASE_ATTRIBUTE_TYPES } from '../../domain/product-base-attribute'
import {
  assertProductBaseWriteInput,
  ProductBaseValidationError,
} from '../../domain/policies/product-base-write.policy'
import type { ProductBaseAttributeInput } from '../../domain/product-base-attribute'
import type { ProductBaseFormDto } from '../dto/product-base.dto'
import { getProductBaseDetailForAdmin } from '../queries/admin-product-base.queries'
import {
  deleteProductBaseAdmin,
  duplicateProductBaseAdmin,
  getProductBaseByIdAdmin,
  insertProductBaseAdmin,
  slugExistsAdmin,
  updateProductBaseAdmin,
} from '../../infrastructure/product-base.repository'

export type ProductBaseActionResult =
  | { success: true; productBaseId?: string }
  | { success: false; error: string }

export async function getProductBaseDetailAction(id: string) {
  await assertSuperAdmin()
  return getProductBaseDetailForAdmin(id)
}

const validationSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    regex: z.string().optional(),
  })
  .optional()
  .nullable()

const attributeSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  type: z.enum(PRODUCT_BASE_ATTRIBUTE_TYPES),
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  placeholder: z.string().trim().max(200).optional().nullable(),
  options: z.array(z.string().trim().min(1)).optional().nullable(),
  validation: validationSchema,
  sortOrder: z.number().int().min(0),
  isVisible: z.boolean(),
  isFilterable: z.boolean(),
  isSearchable: z.boolean(),
  isVariantDimension: z.boolean(),
  allowVariantPricing: z.boolean(),
  scoreContribution: z.record(z.string(), z.number()).optional().nullable(),
})

const formSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional().nullable(),
  type: z.enum(PRODUCT_BASE_TYPES),
  baseImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  imageStrategy: z.enum(PRODUCT_BASE_IMAGE_STRATEGIES),
  attributes: z.array(attributeSchema).default([]),
})

const updateSchema = formSchema.extend({
  productBaseId: z.string().uuid(),
})

const idSchema = z.object({
  productBaseId: z.string().uuid(),
})

const statusSchema = z.object({
  productBaseId: z.string().uuid(),
  status: z.enum(PRODUCT_BASE_STATUSES),
})

function revalidateProductBaseSurfaces() {
  revalidatePath(ADMIN_PRODUCT_BASES_PATH)
  revalidatePath(ADMIN_CATEGORIES_PATH)
}

function getActionErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return fallback
}

function mapAttributes(attributes: z.infer<typeof attributeSchema>[]): ProductBaseAttributeInput[] {
  return attributes.map((attr) => ({
    id: attr.id,
    key: attr.key,
    label: attr.label,
    description: attr.description ?? null,
    type: attr.type,
    required: attr.required,
    defaultValue: attr.defaultValue,
    placeholder: attr.placeholder ?? null,
    options: attr.options ?? null,
    validation: attr.validation ?? null,
    sortOrder: attr.sortOrder,
    isVisible: attr.isVisible,
    isFilterable: attr.isFilterable,
    isSearchable: attr.isSearchable,
    isVariantDimension: attr.isVariantDimension,
    allowVariantPricing: attr.allowVariantPricing,
    scoreContribution: attr.scoreContribution ?? null,
  }))
}

async function resolveUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  const admin = createAdminClient()
  let candidate = baseSlug
  let suffix = 1

  while (await slugExistsAdmin(admin, candidate, excludeId)) {
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return candidate
}

async function validateFormInput(input: z.infer<typeof formSchema>): Promise<{
  slug: string
  attributes: ProductBaseAttributeInput[]
}> {
  const categories = await listCategoriesForAdmin()
  const attributes = mapAttributes(input.attributes)
  const slug = (input.slug?.trim() || slugifyProductBaseName(input.name)).replace(/^-+|-+$/g, '')

  if (!slug) {
    throw new ProductBaseValidationError('No se pudo generar un slug válido.')
  }

  assertProductBaseWriteInput({
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId,
    baseImageUrl: input.baseImageUrl || null,
    imageStrategy: input.imageStrategy,
    attributes,
    categories,
  })

  return { slug, attributes }
}

export async function createProductBaseAction(
  input: ProductBaseFormDto,
): Promise<ProductBaseActionResult> {
  const parsed = formSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()
    const { slug, attributes } = await validateFormInput(parsed.data)
    const uniqueSlug = await resolveUniqueSlug(slug)
    const productBaseId = randomUUID()

    await withAudit(
      actor,
      {
        action: 'product_base.create',
        entityType: 'product_base',
        entityId: productBaseId,
        metadata: { slug: uniqueSlug, type: parsed.data.type },
      },
      async () => {
        await insertProductBaseAdmin(admin, {
          id: productBaseId,
          name: parsed.data.name,
          slug: uniqueSlug,
          description: parsed.data.description,
          categoryId: parsed.data.categoryId,
          subcategoryId: parsed.data.subcategoryId,
          type: parsed.data.type,
          status: 'DRAFT',
          baseImageUrl: parsed.data.baseImageUrl || null,
          imageStrategy: parsed.data.imageStrategy,
          attributes,
        })
      },
    )

    revalidateProductBaseSurfaces()
    return { success: true, productBaseId }
  } catch (err) {
    if (err instanceof ProductBaseValidationError) {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: getActionErrorMessage(err, 'No se pudo crear el Product Base.'),
    }
  }
}

export async function updateProductBaseAction(
  input: ProductBaseFormDto & { productBaseId: string },
): Promise<ProductBaseActionResult> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()
    const { slug, attributes } = await validateFormInput(parsed.data)
    const uniqueSlug = await resolveUniqueSlug(slug, parsed.data.productBaseId)

    await withAudit(
      actor,
      {
        action: 'product_base.update',
        entityType: 'product_base',
        entityId: parsed.data.productBaseId,
      },
      async () => {
        await updateProductBaseAdmin(admin, parsed.data.productBaseId, {
          name: parsed.data.name,
          slug: uniqueSlug,
          description: parsed.data.description,
          categoryId: parsed.data.categoryId,
          subcategoryId: parsed.data.subcategoryId,
          type: parsed.data.type,
          baseImageUrl: parsed.data.baseImageUrl || null,
          imageStrategy: parsed.data.imageStrategy,
          attributes,
        })
      },
    )

    revalidateProductBaseSurfaces()
    return { success: true, productBaseId: parsed.data.productBaseId }
  } catch (err) {
    if (err instanceof ProductBaseValidationError) {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: getActionErrorMessage(err, 'No se pudo actualizar el Product Base.'),
    }
  }
}

export async function duplicateProductBaseAction(
  input: z.input<typeof idSchema>,
): Promise<ProductBaseActionResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()
    const source = await getProductBaseByIdAdmin(admin, parsed.data.productBaseId)
    if (!source) return { success: false, error: 'Product Base no encontrado.' }
    const uniqueSlug = await resolveUniqueSlug(`${source.slug}-copy`)

    let productBaseId = ''

    await withAudit(
      actor,
      {
        action: 'product_base.duplicate',
        entityType: 'product_base',
        entityId: parsed.data.productBaseId,
      },
      async () => {
        productBaseId = await duplicateProductBaseAdmin(admin, parsed.data.productBaseId, uniqueSlug)
      },
    )

    revalidateProductBaseSurfaces()
    return { success: true, productBaseId }
  } catch (err) {
    return {
      success: false,
      error: getActionErrorMessage(err, 'No se pudo duplicar el Product Base.'),
    }
  }
}

export async function setProductBaseStatusAction(
  input: z.input<typeof statusSchema>,
): Promise<ProductBaseActionResult> {
  const parsed = statusSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    await withAudit(
      actor,
      {
        action: 'product_base.set_status',
        entityType: 'product_base',
        entityId: parsed.data.productBaseId,
        metadata: { status: parsed.data.status },
      },
      async () => {
        await updateProductBaseAdmin(admin, parsed.data.productBaseId, {
          status: parsed.data.status,
        })
      },
    )

    revalidateProductBaseSurfaces()
    return { success: true, productBaseId: parsed.data.productBaseId }
  } catch (err) {
    return {
      success: false,
      error: getActionErrorMessage(err, 'No se pudo cambiar el estado.'),
    }
  }
}

export async function deleteProductBaseAction(
  input: z.input<typeof idSchema>,
): Promise<ProductBaseActionResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    const { data: row, error: fetchError } = await admin
      .from('product_base')
      .select('status')
      .eq('id', parsed.data.productBaseId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!row) return { success: false, error: 'Product Base no encontrado.' }
    if ((row as { status: string }).status === 'ACTIVE') {
      return { success: false, error: 'Desactivá el Product Base antes de eliminarlo.' }
    }

    await withAudit(
      actor,
      {
        action: 'product_base.delete',
        entityType: 'product_base',
        entityId: parsed.data.productBaseId,
      },
      async () => {
        await deleteProductBaseAdmin(admin, parsed.data.productBaseId)
      },
    )

    revalidateProductBaseSurfaces()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: getActionErrorMessage(err, 'No se pudo eliminar el Product Base.'),
    }
  }
}
