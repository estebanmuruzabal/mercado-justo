import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getUserRoleByUserId } from '@/server/queries/user.queries'
import { canAccessAdmin, can, type Permission } from '@/lib/auth/permissions'
import { isStaff, type Role } from '@/lib/roles'
import { HOME_PATH, SIGN_IN_PATH, signInPathWithCallback } from '@/lib/routes'

export type StaffContext = {
  userId: string
  role: Role
}

/**
 * Server Component guard. Ensures the current user is platform staff, otherwise
 * redirects. Use at the top of admin route layouts/pages.
 *
 * - Not authenticated -> sign in (with callback back to the admin page).
 * - Authenticated but not staff -> home.
 */
export async function requireStaff(callbackUrl?: string): Promise<StaffContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(callbackUrl ? signInPathWithCallback(callbackUrl) : SIGN_IN_PATH)
  }

  const role = await getUserRoleByUserId(user.id)

  if (!isStaff(role) || !canAccessAdmin(role)) {
    redirect(HOME_PATH)
  }

  return { userId: user.id, role: role as Role }
}

/**
 * Server Component guard that additionally requires a specific capability.
 * Staff lacking the permission are sent to the admin dashboard root.
 */
export async function requirePermission(
  permission: Permission,
  options?: { fallbackPath?: string; callbackUrl?: string },
): Promise<StaffContext> {
  const ctx = await requireStaff(options?.callbackUrl)

  if (!can(ctx.role, permission)) {
    redirect(options?.fallbackPath ?? HOME_PATH)
  }

  return ctx
}

/**
 * Server Action guard. Throws instead of redirecting. Returns the staff context
 * so callers can record the actor in the audit log.
 */
export async function assertPermission(permission: Permission): Promise<StaffContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const role = await getUserRoleByUserId(user.id)

  if (!isStaff(role) || !can(role, permission)) {
    throw new Error('Forbidden')
  }

  return { userId: user.id, role: role as Role }
}
