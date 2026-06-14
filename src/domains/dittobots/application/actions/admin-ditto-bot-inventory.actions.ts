'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { assertSuperAdmin } from '@/shared/auth/guards/require-staff'
import { createAdminClient } from '@/shared/database/admin-client'
import { withAudit } from '@/shared/database/admin-audit'
import {
  ADMIN_DITTOBOT_ASSIGNMENT_PATH,
  ADMIN_DITTOBOT_INVENTORY_PATH,
  ADMIN_DITTOBOTS_PATH,
} from '@/shared/routing/routes'
import {
  DITTO_BOT_INVENTORY_STATUSES,
  type DittoBotInventoryStatus,
} from '../../domain/ditto-bot-inventory-unit'
import { assertAssignableUnits } from '../../domain/ditto-bot-assign.policy'
import { assertDittoSellerAssignmentTarget } from '../../domain/ditto-seller.policy'
import {
  assignUnitsToVendor,
  createBatchWithUnits,
  findUnitsByIdsAdmin,
  registerUnit,
  updateUnitStatusAdmin,
} from '../../infrastructure/ditto-bot-inventory.repository'
import {
  findOfficialDittoBotVendor,
  getDittoBotProductByIdAdmin,
  getVendorByIdAdmin,
  setVendorDittoSeller,
} from '../../infrastructure/ditto-bot-product.repository'

export type AdminDittoBotActionResult = { success: true } | { success: false; error: string }

function revalidateInventorySurfaces() {
  revalidatePath(ADMIN_DITTOBOTS_PATH)
  revalidatePath(ADMIN_DITTOBOT_INVENTORY_PATH)
  revalidatePath(ADMIN_DITTOBOT_ASSIGNMENT_PATH)
}

const registerSchema = z.object({
  serialNumber: z.string().trim().min(3).max(64),
  activationCode: z.string().trim().min(4).max(32),
  model: z.string().trim().min(2).max(64),
  subtype: z.string().trim().max(64).nullable().optional(),
  status: z
    .enum(DITTO_BOT_INVENTORY_STATUSES)
    .optional()
    .default('available'),
})

const statusSchema = z.object({
  unitId: z.string().uuid(),
  status: z.enum(DITTO_BOT_INVENTORY_STATUSES),
})

const batchSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(500),
  serialPrefix: z.string().trim().min(2).max(16).optional(),
  serialStart: z.number().int().min(0).optional(),
})

const assignSchema = z.object({
  unitIds: z.array(z.string().uuid()).min(1),
  vendorId: z.string().uuid(),
})

export async function registerDittoBotUnitAction(
  input: z.input<typeof registerSchema>,
): Promise<AdminDittoBotActionResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    await withAudit(
      actor,
      {
        action: 'ditto_bot.register',
        entityType: 'ditto_bot_inventory_unit',
        entityId: parsed.data.serialNumber,
        metadata: { model: parsed.data.model },
      },
      async () => {
        await registerUnit(admin, {
          serialNumber: parsed.data.serialNumber,
          activationCode: parsed.data.activationCode,
          model: parsed.data.model,
          subtype: parsed.data.subtype,
          status: parsed.data.status as DittoBotInventoryStatus,
        })
      },
    )

    revalidateInventorySurfaces()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo registrar el dispositivo.',
    }
  }
}

export async function createDittoBotBatchAction(
  input: z.input<typeof batchSchema>,
): Promise<AdminDittoBotActionResult & { batchId?: string }> {
  const parsed = batchSchema.safeParse(input)
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

    const product = await getDittoBotProductByIdAdmin(admin, parsed.data.productId)
    if (!product) {
      return { success: false, error: 'Producto DittoBot no encontrado.' }
    }

    let batchId = ''

    await withAudit(
      actor,
      {
        action: 'ditto_bot.create_batch',
        entityType: 'ditto_bot_inventory_batch',
        entityId: parsed.data.productId,
        metadata: { quantity: parsed.data.quantity },
      },
      async () => {
        const result = await createBatchWithUnits(admin, {
          productId: parsed.data.productId,
          productTitle: product.title,
          quantity: parsed.data.quantity,
          serialPrefix: parsed.data.serialPrefix,
          serialStart: parsed.data.serialStart,
          manufacturerVendorId: official.id,
          createdBy: actor.userId,
        })
        batchId = result.batchId
      },
    )

    revalidateInventorySurfaces()
    return { success: true, batchId }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear el lote.',
    }
  }
}

export async function assignDittoBotUnitsAction(
  input: z.input<typeof assignSchema>,
): Promise<AdminDittoBotActionResult> {
  const parsed = assignSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    const vendor = await getVendorByIdAdmin(admin, parsed.data.vendorId)
    if (!vendor) {
      return { success: false, error: 'Vendor no encontrado.' }
    }
    assertDittoSellerAssignmentTarget({
      canSellDittoBots: vendor.canSellDittoBots,
      isOfficialDittoBotVendor: vendor.isOfficial,
    })

    const units = await findUnitsByIdsAdmin(admin, parsed.data.unitIds)
    assertAssignableUnits(
      units.map((u) => ({ id: u.id, status: u.status as DittoBotInventoryStatus })),
    )

    await withAudit(
      actor,
      {
        action: 'ditto_bot.assign_units',
        entityType: 'ditto_bot_inventory_unit',
        entityId: parsed.data.vendorId,
        metadata: { unitIds: parsed.data.unitIds },
      },
      async () => {
        await assignUnitsToVendor(admin, parsed.data.unitIds, parsed.data.vendorId)
      },
    )

    revalidateInventorySurfaces()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo asignar el stock.',
    }
  }
}

export async function updateDittoBotStatusAction(
  input: z.input<typeof statusSchema>,
): Promise<AdminDittoBotActionResult> {
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
        action: 'ditto_bot.update_status',
        entityType: 'ditto_bot_inventory_unit',
        entityId: parsed.data.unitId,
        metadata: { status: parsed.data.status },
      },
      async () => {
        await updateUnitStatusAdmin(admin, {
          unitId: parsed.data.unitId,
          status: parsed.data.status as DittoBotInventoryStatus,
        })
      },
    )

    revalidateInventorySurfaces()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar el estado.',
    }
  }
}

const dittoSellerSchema = z.object({
  vendorId: z.string().uuid(),
  enabled: z.boolean(),
})

export async function setVendorDittoSellerAction(
  input: z.input<typeof dittoSellerSchema>,
): Promise<AdminDittoBotActionResult> {
  const parsed = dittoSellerSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    const vendor = await getVendorByIdAdmin(admin, parsed.data.vendorId)
    if (!vendor) {
      return { success: false, error: 'Vendor no encontrado.' }
    }
    if (vendor.isOfficial) {
      return { success: false, error: 'El vendor oficial no puede ser DittoSeller.' }
    }

    await withAudit(
      actor,
      {
        action: 'ditto_bot.set_ditto_seller',
        entityType: 'store',
        entityId: parsed.data.vendorId,
        metadata: { enabled: parsed.data.enabled },
      },
      async () => {
        await setVendorDittoSeller(admin, parsed.data.vendorId, parsed.data.enabled)
      },
    )

    revalidateInventorySurfaces()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar DittoSeller.',
    }
  }
}
