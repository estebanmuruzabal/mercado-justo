'use server'

import { after } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { assertSuperAdmin } from '@/shared/auth/guards/require-staff'
import { createAdminClient } from '@/shared/database/admin-client'
import { withAudit } from '@/shared/database/admin-audit'
import { ADMIN_VENDORS_PATH } from '@/shared/routing/routes'
import { type VendorStatus } from '@/domains/logistics/domain/types'
import { dispatchNotificationEvent } from '@/shared/events/legacy-notifications/events/dispatch'

export type AdminActionResult = { success: true } | { success: false; error: string }

const vendorIdSchema = z.string().uuid()
const suspendSchema = z.object({
  vendorId: z.string().uuid(),
  reason: z.string().trim().min(3, 'Indicá un motivo.').max(500),
})

const updateStoreSchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string().trim().min(2, 'Nombre muy corto.').max(120),
  bio: z.string().trim().max(500).optional(),
})

async function setVendorStatus(
  vendorId: string,
  status: VendorStatus,
  extra: Record<string, unknown>,
  action: string,
): Promise<AdminActionResult> {
  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    await withAudit(
      actor,
      { action, entityType: 'store', entityId: vendorId, metadata: { status, ...extra } },
      async () => {
        const { error } = await admin
          .from('store')
          .update({ status, ...extra } as never)
          .eq('id', vendorId)
        if (error) throw error
      },
    )

    revalidatePath(ADMIN_VENDORS_PATH)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo actualizar el vendedor.' }
  }
}

export async function approveVendorAction(vendorId: string): Promise<AdminActionResult> {
  const parsed = vendorIdSchema.safeParse(vendorId)
  if (!parsed.success) return { success: false, error: 'Vendedor inválido.' }
  const result = await setVendorStatus(
    parsed.data,
    'active',
    { suspended_at: null, suspension_reason: null },
    'vendor.approve',
  )
  if (result.success) {
    after(() =>
      dispatchNotificationEvent({ type: 'vendor.approved', payload: { storeId: parsed.data } }),
    )
  }
  return result
}

export async function suspendVendorAction(
  input: z.input<typeof suspendSchema>,
): Promise<AdminActionResult> {
  const parsed = suspendSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }
  return setVendorStatus(
    parsed.data.vendorId,
    'suspended',
    { suspended_at: new Date().toISOString(), suspension_reason: parsed.data.reason },
    'vendor.suspend',
  )
}

export async function reactivateVendorAction(vendorId: string): Promise<AdminActionResult> {
  const parsed = vendorIdSchema.safeParse(vendorId)
  if (!parsed.success) return { success: false, error: 'Vendedor inválido.' }
  return setVendorStatus(
    parsed.data,
    'active',
    { suspended_at: null, suspension_reason: null },
    'vendor.reactivate',
  )
}

export async function updateVendorStoreAction(
  input: z.input<typeof updateStoreSchema>,
): Promise<AdminActionResult> {
  const parsed = updateStoreSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    await withAudit(
      actor,
      {
        action: 'vendor.update_store',
        entityType: 'store',
        entityId: parsed.data.vendorId,
        metadata: { name: parsed.data.name, bio: parsed.data.bio ?? null },
      },
      async () => {
        const { error } = await admin
          .from('store')
          .update({
            name: parsed.data.name,
            bio: parsed.data.bio ?? null,
          } as never)
          .eq('id', parsed.data.vendorId)
        if (error) throw error
      },
    )

    revalidatePath(ADMIN_VENDORS_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo editar la tienda.',
    }
  }
}

export async function featureVendorAction(
  vendorId: string,
  featured: boolean,
): Promise<AdminActionResult> {
  const parsed = vendorIdSchema.safeParse(vendorId)
  if (!parsed.success) return { success: false, error: 'Vendedor inválido.' }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    await withAudit(
      actor,
      {
        action: featured ? 'vendor.feature' : 'vendor.unfeature',
        entityType: 'store',
        entityId: parsed.data,
        metadata: { is_featured: featured },
      },
      async () => {
        const { error } = await admin
          .from('store')
          .update({ is_featured: featured } as never)
          .eq('id', parsed.data)
        if (error) throw error
      },
    )

    revalidatePath(ADMIN_VENDORS_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo destacar el vendedor.',
    }
  }
}
