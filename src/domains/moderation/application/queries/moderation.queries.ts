import { createClient } from '@/shared/database/supabase/server'
import { type ModerationEntityType, type ReportStatus } from '@/domains/logistics/domain/types'

export type AdminReportRow = {
  id: string
  entityType: ModerationEntityType
  entityId: string
  reason: string
  details: string | null
  status: ReportStatus
  reporterName: string
  createdAt: string
}

/** Moderation report queue (vendors / listings / reviews / profiles). */
export async function listReportsForAdmin(): Promise<AdminReportRow[]> {
  const supabase = await createClient()

  const [reportsRes, usersRes] = await Promise.all([
    supabase
      .from('moderation_report')
      .select('id, entity_type, entity_id, reason, details, status, reporter_id, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('user').select('id, full_name, email'),
  ])

  const userName = new Map<string, string>()
  for (const u of (usersRes.data ?? []) as {
    id: string
    full_name: string | null
    email: string | null
  }[]) {
    userName.set(u.id, u.full_name || u.email || 'Usuario')
  }

  return ((reportsRes.data ?? []) as Array<{
    id: string
    entity_type: string
    entity_id: string
    reason: string
    details: string | null
    status: string
    reporter_id: string | null
    created_at: string
  }>).map((r) => ({
    id: r.id,
    entityType: r.entity_type as ModerationEntityType,
    entityId: r.entity_id,
    reason: r.reason,
    details: r.details,
    status: r.status as ReportStatus,
    reporterName: r.reporter_id ? userName.get(r.reporter_id) ?? 'Usuario' : 'Anónimo',
    createdAt: r.created_at,
  }))
}
