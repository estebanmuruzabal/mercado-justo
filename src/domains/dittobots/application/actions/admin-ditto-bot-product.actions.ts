'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { listCategoriesForAdmin } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import { assertSuperAdmin } from '@/shared/auth/guards/require-staff'
import { createAdminClient } from '@/shared/database/admin-client'
import { withAudit } from '@/shared/database/admin-audit'
import {
  ADMIN_DITTOBOT_ASSIGNMENT_PATH,
  ADMIN_DITTOBOT_PRODUCTS_PATH,
} from '@/shared/routing/routes'

import {
  assertDittoBotCategory,
  assertDittoBotImage,
  assertDittoBotTags,
  buildDittoBotCharacteristics,
  DittoBotProductValidationError,
  parseDittoBotProductInput,
} from '../../domain/ditto-bot-product'
import { DEFAULT_DITTO_BOT_SETTINGS } from '../../domain/ditto-bot-settings'
import {
  deactivateDittoBotProduct,
  findOfficialDittoBotVendor,
  getDittoBotProductByIdAdmin,
  insertDittoBotProduct,
  updateDittoBotProduct,
} from '../../infrastructure/ditto-bot-product.repository'

export type DittoBotProductActionResult =
  | { success: true; productId?: string }
  | { success: false; error: string }

const settingsSchema = z.object({
  requiresActivation: z.boolean().optional(),
  autoGenerateSerial: z.boolean().optional(),
  autoGenerateActivationCode: z.boolean().optional(),
  supportsOta: z.boolean().optional(),
  requiresOwner: z.boolean().optional(),
  requiresVendorAssignment: z.boolean().optional(),
  requiresDeviceLink: z.boolean().optional(),
})

const productSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  categoryId: z.string().uuid(),
  price: z.number().positive(),
  tags: z.union([z.array(z.string()), z.string()]),
  image: z.string().trim().url('La imagen principal debe ser una URL válida.'),
  images: z.array(z.string().url()).optional().default([]),
  dittoBotSettings: settingsSchema.optional(),
})

const updateProductSchema = productSchema.partial().extend({
  productId: z.string().uuid(),
})

const deactivateSchema = z.object({
  productId: z.string().uuid(),
})

function revalidateProductSurfaces() {
  revalidatePath(ADMIN_DITTOBOT_PRODUCTS_PATH)
}

export async function createDittoBotProductAction(
  input: z.input<typeof productSchema>,
): Promise<DittoBotProductActionResult> {
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()
    const official = await findOfficialDittoBotVendor(admin)

    if (!official) {
      return { success: false, error: 'No hay vendor oficial DittoBot configurado.' }
    }

    const categories = await listCategoriesForAdmin()
    const productInput = parseDittoBotProductInput({
      ...parsed.data,
      dittoBotSettings: parsed.data.dittoBotSettings ?? DEFAULT_DITTO_BOT_SETTINGS,
    })

    assertDittoBotCategory(productInput.categoryId, categories)
    const tags = assertDittoBotTags(productInput.tags)
    const image = assertDittoBotImage(parsed.data.image)
    const characteristics = buildDittoBotCharacteristics({
      tags,
      image,
      images: parsed.data.images ?? [],
    })

    let productId = ''

    await withAudit(
      actor,
      {
        action: 'ditto_bot.create_product',
        entityType: 'listing',
        entityId: productInput.title,
        metadata: { categoryId: productInput.categoryId },
      },
      async () => {
        productId = await insertDittoBotProduct(admin, {
          storeId: official.id,
          title: productInput.title,
          description: productInput.description,
          categoryId: productInput.categoryId,
          price: productInput.price,
          characteristics,
          dittoBotSettings: productInput.dittoBotSettings,
          latitude: official.latitude,
          longitude: official.longitude,
          actorUserId: actor.userId,
        })
      },
    )

    revalidateProductSurfaces()
    return { success: true, productId }
  } catch (err) {
    if (err instanceof DittoBotProductValidationError) {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear el producto.',
    }
  }
}

export async function updateDittoBotProductAction(
  input: z.input<typeof updateProductSchema>,
): Promise<DittoBotProductActionResult> {
  const parsed = updateProductSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()
    const { productId, tags, dittoBotSettings, image, images, ...rest } = parsed.data

    const updatePayload: Parameters<typeof updateDittoBotProduct>[2] = {}

    if (rest.title !== undefined) updatePayload.title = rest.title.trim()
    if (rest.description !== undefined) updatePayload.description = rest.description.trim()
    if (rest.categoryId !== undefined) {
      const categories = await listCategoriesForAdmin()
      assertDittoBotCategory(rest.categoryId, categories)
      updatePayload.categoryId = rest.categoryId
    }
    if (rest.price !== undefined) updatePayload.price = rest.price
    if (tags !== undefined || image !== undefined || images !== undefined) {
      const existing = await getDittoBotProductByIdAdmin(admin, productId)
      if (!existing) {
        return { success: false, error: 'Producto no encontrado.' }
      }

      const normalizedTags = tags !== undefined
        ? assertDittoBotTags(Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()))
        : existing.tags

      updatePayload.characteristics = buildDittoBotCharacteristics({
        tags: normalizedTags,
        image: image !== undefined ? assertDittoBotImage(image) : existing.image,
        images: images !== undefined ? images : existing.images,
      })
    }
    if (dittoBotSettings !== undefined) {
      updatePayload.dittoBotSettings = {
        ...DEFAULT_DITTO_BOT_SETTINGS,
        ...dittoBotSettings,
      }
    }

    await withAudit(
      actor,
      {
        action: 'ditto_bot.update_product',
        entityType: 'listing',
        entityId: productId,
      },
      async () => {
        await updateDittoBotProduct(admin, productId, updatePayload)
      },
    )

    revalidateProductSurfaces()
    return { success: true, productId }
  } catch (err) {
    if (err instanceof DittoBotProductValidationError) {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar el producto.',
    }
  }
}

export async function deactivateDittoBotProductAction(
  input: z.input<typeof deactivateSchema>,
): Promise<DittoBotProductActionResult> {
  const parsed = deactivateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    await withAudit(
      actor,
      {
        action: 'ditto_bot.deactivate_product',
        entityType: 'listing',
        entityId: parsed.data.productId,
      },
      async () => {
        await deactivateDittoBotProduct(admin, parsed.data.productId)
      },
    )

    revalidateProductSurfaces()
    revalidatePath(ADMIN_DITTOBOT_ASSIGNMENT_PATH)
    return { success: true, productId: parsed.data.productId }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo desactivar el producto.',
    }
  }
}
