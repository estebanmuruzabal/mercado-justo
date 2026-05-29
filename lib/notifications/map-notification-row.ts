import type { Notification, NotificationRowPayload, NotificationType } from './types'

export function mapNotificationRow(row: NotificationRowPayload): Notification {
  const audience = row.audience
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    audience,
    target: audience === 'vendor' ? 'seller' : 'buyer',
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    readState: row.read ? 'read' : 'unread',
    href: row.href ?? undefined,
    metadata: normalizeMetadata(row.metadata),
  }
}

function normalizeMetadata(
  value: Record<string, unknown> | null,
): Record<string, string | number | boolean> | undefined {
  if (!value || typeof value !== 'object') return undefined
  const out: Record<string, string | number | boolean> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
      out[key] = raw
    }
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export function audienceToStoreKey(audience: Notification['audience']): 'buyer' | 'vendor' {
  return audience
}
