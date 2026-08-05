import { createClient } from '@/shared/database/supabase/server'
import { isRole, type Role } from '@/domains/users/domain/roles'

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

export type UserProfileSummary = {
  id: string
  email: string | null
  fullName: string | null
  avatarUrl: string | null
}

export async function getUserProfileSummaryByUserId(userId: string): Promise<UserProfileSummary | null> {
  const supabase = await createClient()

  const { data, error } = (await supabase
    .from('user' as never)
    .select('id, email, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle()) as {
    data: {
      id: string
      email: string | null
      full_name: string | null
      avatar_url: string | null
    } | null
    error: { message: string } | null
  }

  if (error) {
    throw new Error(error.message)
  }

  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
  }
}
