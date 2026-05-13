import { createClient } from '@/lib/supabase/server'
import { isRole, type Role } from '@/lib/roles'

export async function getUserRoleByUserId(userId: string): Promise<Role | null> {
  const supabase = await createClient()

  const { data, error } = (await supabase
    .from('user' as never)
    .select('role')
    .eq('id', userId)
    .maybeSingle()) as {
    data: { role: string } | null
    error: { message: string } | null
  }

  if (error || !data?.role) {
    return null
  }

  return isRole(data.role) ? data.role : null
}
