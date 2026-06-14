import { createClient } from '@/shared/database/supabase/server'
import { ROLES, type Role } from '@/domains/users/domain/roles'
import { type UserStatus } from '@/domains/logistics/domain/types'

export type AdminUserRow = {
  id: string
  fullName: string | null
  email: string | null
  role: Role
  status: UserStatus
  createdAt: string
  lastAccessAt: string | null
  totalSpent: number
  orderCount: number
  suspensionReason: string | null
}

const NON_VENDOR_ROLES = [
  ROLES.USER,
  ROLES.SUPER_ADMIN,
  ROLES.LOGISTICS_ADMIN,
  ROLES.MODERATOR,
  ROLES.SUPPORT,
] as const

/**
 * Platform users excluding vendors (sellers and vendor-side roles).
 */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  const supabase = await createClient()

  const [usersRes, ordersRes] = await Promise.all([
    supabase
      .from('user')
      .select(
        'id, full_name, email, role, status, created_at, last_access_at, suspension_reason',
      )
      .in('role', [...NON_VENDOR_ROLES])
      .order('created_at', { ascending: false }),
    supabase.from('order').select('buyer_id, total'),
  ])

  const spendByBuyer = new Map<string, { total: number; count: number }>()
  for (const o of (ordersRes.data ?? []) as { buyer_id: string; total: number | null }[]) {
    const agg = spendByBuyer.get(o.buyer_id) ?? { total: 0, count: 0 }
    agg.count += 1
    agg.total += Number(o.total ?? 0)
    spendByBuyer.set(o.buyer_id, agg)
  }

  return ((usersRes.data ?? []) as Array<{
    id: string
    full_name: string | null
    email: string | null
    role: string
    status: string
    created_at: string
    last_access_at: string | null
    suspension_reason: string | null
  }>).map((u) => {
    const spend = spendByBuyer.get(u.id) ?? { total: 0, count: 0 }
    return {
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      role: u.role as Role,
      status: (u.status as UserStatus) ?? 'active',
      createdAt: u.created_at,
      lastAccessAt: u.last_access_at,
      totalSpent: spend.total,
      orderCount: spend.count,
      suspensionReason: u.suspension_reason,
    }
  })
}

export type AdminAuditLogRow = {
  id: string
  action: string
  entityType: string
  entityId: string | null
  actorRole: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export async function listUserActivityForAdmin(userId: string): Promise<AdminAuditLogRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, action, entity_type, entity_id, actor_role, metadata, created_at')
    .or(`entity_id.eq.${userId},actor_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return ((data ?? []) as Array<{
    id: string
    action: string
    entity_type: string
    entity_id: string | null
    actor_role: string | null
    metadata: Record<string, unknown> | null
    created_at: string
  }>).map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actorRole: row.actor_role,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }))
}
