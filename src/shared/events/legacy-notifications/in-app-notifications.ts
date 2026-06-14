import { createServiceClient } from '@/shared/database/supabase/service'
import { ADMIN_MODERATION_PATH, VENDOR_LISTINGS_PATH } from '@/shared/routing/routes'

import type { NotificationAudience } from './types'

type InAppNotificationInput = {
  userId: string
  audience: NotificationAudience
  type: string
  title: string
  body: string
  href?: string | null
  metadata?: Record<string, string | number | boolean>
}

async function insertNotifications(rows: InAppNotificationInput[]): Promise<void> {
  if (rows.length === 0) return

  const service = createServiceClient()
  const { error } = await service.from('notification').insert(
    rows.map((row) => ({
      user_id: row.userId,
      audience: row.audience,
      type: row.type,
      title: row.title,
      body: row.body,
      href: row.href ?? null,
      metadata: row.metadata ?? {},
      read: false,
    })) as never,
  )

  if (error) throw error
}

export async function notifySuperAdminsListingReviewRequested(input: {
  listingId: string
  listingTitle: string
}): Promise<void> {
  try {
    const service = createServiceClient()
    const { data, error } = await service.from('user').select('id').eq('role', 'super-admin')
    if (error) throw error

    const rows = ((data ?? []) as Array<{ id: string }>).map((admin) => ({
      userId: admin.id,
      audience: 'buyer' as const,
      type: 'listing_review_requested',
      title: 'Nuevo listing pendiente de revisión',
      body: `“${input.listingTitle}” fue publicado y espera revisión.`,
      href: ADMIN_MODERATION_PATH,
      metadata: {
        listingId: input.listingId,
      },
    }))

    await insertNotifications(rows)
  } catch (err) {
    console.error(
      '[notifications] notifySuperAdminsListingReviewRequested failed:',
      err instanceof Error ? err.message : err,
    )
  }
}

export async function notifyVendorListingModerationDecision(input: {
  userId: string
  listingId: string
  listingTitle: string
  decision: 'approved' | 'rejected'
  reason?: string | null
}): Promise<void> {
  try {
    const title =
      input.decision === 'approved' ? 'Tu listing fue aprobado' : 'Tu listing fue rechazado'
    const body =
      input.decision === 'approved'
        ? `“${input.listingTitle}” ya está visible en el marketplace.`
        : `“${input.listingTitle}” fue rechazado.${input.reason ? ` Motivo: ${input.reason}` : ''}`

    await insertNotifications([
      {
        userId: input.userId,
        audience: 'vendor',
        type: input.decision === 'approved' ? 'listing_approved' : 'listing_rejected',
        title,
        body,
        href: VENDOR_LISTINGS_PATH,
        metadata: {
          listingId: input.listingId,
          decision: input.decision,
          ...(input.reason ? { reason: input.reason } : {}),
        },
      },
    ])
  } catch (err) {
    console.error(
      '[notifications] notifyVendorListingModerationDecision failed:',
      err instanceof Error ? err.message : err,
    )
  }
}
