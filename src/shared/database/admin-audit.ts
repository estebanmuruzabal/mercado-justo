import { createAdminClient } from '@/shared/database/admin-client'
import type { Role } from '@/domains/users/domain/roles'

export type AuditActor = {
  userId: string
  role: Role
}

export type AuditEntry = {
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Write a single audit-log row via the service role. Best-effort: a logging
 * failure must never roll back the action it describes.
 */
export async function recordAudit(actor: AuditActor, entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('admin_audit_log').insert({
      actor_id: actor.userId,
      actor_role: actor.role,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      metadata: (entry.metadata ?? {}) as never,
    } as never)
  } catch (err) {
    console.error('[admin-audit] failed to record audit entry', entry.action, err)
  }
}

/**
 * Run a sensitive admin mutation and record an audit entry once it succeeds.
 * The audit entry can depend on the mutation result via `describe`.
 */
export async function withAudit<T>(
  actor: AuditActor,
  describe: AuditEntry | ((result: T) => AuditEntry),
  fn: () => Promise<T>,
): Promise<T> {
  const result = await fn()
  const entry = typeof describe === 'function' ? describe(result) : describe
  await recordAudit(actor, entry)
  return result
}
