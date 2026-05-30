'use server'

import { after } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { assertPermission } from '@/server/auth/require-staff'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { createAdminClient } from '@/server/admin/client'
import { withAudit } from '@/server/admin/audit'
import { ADMIN_VENDORS_PATH } from '@/lib/routes'
import { type VendorStatus } from '@/lib/admin/types'
import { dispatchNotificationEvent } from '@/lib/notifications/events/dispatch'

export type AdminActionResult = { success: true } | { success: false; error: string }

const vendorIdSchema = z.string().uuid()
const suspendSchema = z.object({
  vendorId: z.string().uuid(),
  reason: z.string().trim().min(3, 'Indicá un motivo.').max(500),
})

async function setVendorStatus(
  vendorId: string,
  status: VendorStatus,
  extra: Record<string, unknown>,
  permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
  action: string,
): Promise<AdminActionResult> {
  try {
    const actor = await assertPermission(permission)
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
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo actualizar el vendor.' }
  }
}

export async function approveVendorAction(vendorId: string): Promise<AdminActionResult> {
  const parsed = vendorIdSchema.safeParse(vendorId)
  if (!parsed.success) return { success: false, error: 'Vendor inválido.' }
  const result = await setVendorStatus(
    parsed.data,
    'active',
    { suspended_at: null, suspension_reason: null },
    PERMISSIONS.VENDORS_APPROVE,
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
    PERMISSIONS.VENDORS_SUSPEND,
    'vendor.suspend',
  )
}

export async function disableVendorAction(vendorId: string): Promise<AdminActionResult> {
  const parsed = vendorIdSchema.safeParse(vendorId)
  if (!parsed.success) return { success: false, error: 'Vendor inválido.' }
  return setVendorStatus(
    parsed.data,
    'disabled',
    { suspended_at: new Date().toISOString() },
    PERMISSIONS.VENDORS_DISABLE,
    'vendor.disable',
  )
}

export async function reactivateVendorAction(vendorId: string): Promise<AdminActionResult> {
  const parsed = vendorIdSchema.safeParse(vendorId)
  if (!parsed.success) return { success: false, error: 'Vendor inválido.' }
  return setVendorStatus(
    parsed.data,
    'active',
    { suspended_at: null, suspension_reason: null },
    PERMISSIONS.VENDORS_APPROVE,
    'vendor.reactivate',
  )
}
