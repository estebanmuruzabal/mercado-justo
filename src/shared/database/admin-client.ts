import { createServiceClient } from '@/shared/database/supabase/service'

/**
 * Service-role Supabase client for sensitive admin WRITES.
 *
 * This bypasses RLS, so it must ONLY be used from server actions that have
 * already passed an `assertPermission(...)` check and are wrapped in audit
 * logging (see server/admin/audit.ts). Never expose this to the client.
 */
export function createAdminClient() {
  return createServiceClient()
}
