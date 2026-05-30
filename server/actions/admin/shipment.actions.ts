'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { assertPermission } from '@/server/auth/require-staff'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { createAdminClient } from '@/server/admin/client'
import { withAudit } from '@/server/admin/audit'
import { assertTransition } from '@/lib/admin/engines/fulfillment-engine'
import { ADMIN_ORDERS_PATH } from '@/lib/routes'
import { SHIPMENT_STATUSES, type ShipmentStatus } from '@/lib/admin/types'

export type AdminActionResult = { success: true } | { success: false; error: string }

const overrideSchema = z.object({
  shipmentId: z.string().uuid(),
  toStatus: z.enum(SHIPMENT_STATUSES),
})

/**
 * Force a shipment logistic-status transition (admin override). Validates the
 * transition with the fulfillment engine, writes via the service role, audits it.
 */
export async function overrideShipmentStatusAction(
  input: z.input<typeof overrideSchema>,
): Promise<AdminActionResult> {
  const parsed = overrideSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }
  const { shipmentId, toStatus } = parsed.data

  try {
    const actor = await assertPermission(PERMISSIONS.SHIPMENTS_OVERRIDE)
    const admin = createAdminClient()

    const { data: current, error: readError } = await admin
      .from('shipment')
      .select('status')
      .eq('id', shipmentId)
      .maybeSingle()

    if (readError) throw readError
    if (!current) return { success: false, error: 'Envío no encontrado.' }

    const from = (current as { status: ShipmentStatus }).status
    const to = assertTransition(from, toStatus)

    await withAudit(
      actor,
      {
        action: 'shipment.status_override',
        entityType: 'shipment',
        entityId: shipmentId,
        metadata: { from, to },
      },
      async () => {
        const { error } = await admin
          .from('shipment')
          .update({ status: to } as never)
          .eq('id', shipmentId)
        if (error) throw error
      },
    )

    revalidatePath(ADMIN_ORDERS_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar el envío.',
    }
  }
}
