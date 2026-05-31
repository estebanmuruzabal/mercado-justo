import { createServiceClient } from '@/shared/database/supabase/service'

/**
 * Resolve a user's email from auth (service-role). Returns null when missing.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const service = createServiceClient()
    const { data, error } = await service.auth.admin.getUserById(userId)

    if (error) throw error
    const email = data.user?.email?.trim()
    return email || null
  } catch (err) {
    console.error(
      '[email] getUserEmail failed:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}
