'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { assertPermission } from '@/server/auth/require-staff'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { createAdminClient } from '@/server/admin/client'
import { withAudit } from '@/server/admin/audit'
import { assertListingModeration } from '@/lib/admin/engines/moderation-engine'
import { ADMIN_LISTINGS_PATH } from '@/lib/routes'
import { type ListingModerationStatus } from '@/lib/admin/types'

export type AdminActionResult = { success: true } | { success: false; error: string }

const moderateSchema = z.object({
  listingId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'hidden']),
  reason: z.string().trim().max(500).optional(),
})

/**
 * Apply a moderation decision to a listing. Validates the transition through the
 * moderation engine, writes via the service role, and records an audit entry.
 */
export async function moderateListingAction(
  input: z.input<typeof moderateSchema>,
): Promise<AdminActionResult> {
  const parsed = moderateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }
  const { listingId, decision, reason } = parsed.data

  try {
    const actor = await assertPermission(PERMISSIONS.LISTINGS_MODERATE)
    const admin = createAdminClient()

    const { data: current, error: readError } = await admin
      .from('listing')
      .select('moderation_status')
      .eq('id', listingId)
      .maybeSingle()

    if (readError) throw readError
    if (!current) return { success: false, error: 'Listing no encontrado.' }

    const from = ((current as { moderation_status: string }).moderation_status ??
      'pending') as ListingModerationStatus
    const to = assertListingModeration(from, decision)

    await withAudit(
      actor,
      {
        action: `listing.${to}`,
        entityType: 'listing',
        entityId: listingId,
        metadata: { from, to, reason: reason ?? null },
      },
      async () => {
        const { error } = await admin
          .from('listing')
          .update({
            moderation_status: to,
            moderation_reason: reason ?? null,
            moderated_by: actor.userId,
            moderated_at: new Date().toISOString(),
          } as never)
          .eq('id', listingId)
        if (error) throw error
      },
    )

    revalidatePath(ADMIN_LISTINGS_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo moderar el listing.',
    }
  }
}
