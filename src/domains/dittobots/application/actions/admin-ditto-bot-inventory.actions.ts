'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { assertSuperAdmin } from '@/shared/auth/guards/require-staff'
import { createAdminClient } from '@/shared/database/admin-client'
import { withAudit } from '@/shared/database/admin-audit'
import { ADMIN_DITTOBOT_INVENTORY_PATH } from '@/shared/routing/routes'
import {
  DITTO_BOT_INVENTORY_STATUSES,
  type DittoBotInventoryStatus,
} from '../../domain/ditto-bot-inventory-unit'
import {
  registerUnit,
  updateUnitStatusAdmin,
} from '../../infrastructure/ditto-bot-inventory.repository'

export type AdminDittoBotActionResult = { success: true } | { success: false; error: string }

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

    revalidatePath(ADMIN_DITTOBOT_INVENTORY_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo registrar el dispositivo.',
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

    revalidatePath(ADMIN_DITTOBOT_INVENTORY_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar el estado.',
    }
  }
}
