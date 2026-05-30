'use server'

import { ROLES, isStaff } from '@/lib/roles'
import { mapAuthErrorMessage } from '@/lib/auth/errors'
import { getPostAuthRedirectPath } from '@/lib/auth/callback-url'
import { createClient } from '@/lib/supabase/server'
import { getUserRoleByUserId } from '@/server/queries/user.queries'
import { ADMIN_DASHBOARD_PATH } from '@/lib/routes'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { getSupabaseAuthCookieNames } from '@/lib/supabase/sanitize-auth-cookies'

export interface SignUpData {
  email: string
  password: string
  fullName?: string
  callbackUrl?: string
}

export interface SignInData {
  email: string
  password: string
  callbackUrl?: string
}

export type AuthActionResult = { ok: true; redirectTo: string } | { error: string }

function revalidateAuthSurfaces() {
  revalidatePath('/', 'layout')
}

async function ensureSessionAfterSignUp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: SignUpData,
): Promise<AuthActionResult | null> {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        role: ROLES.USER,
      },
    },
  })

  if (signUpError) {
    return { error: mapAuthErrorMessage(signUpError.message) }
  }

  if (authData.session) {
    return null
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (signInError) {
    return { error: mapAuthErrorMessage(signInError.message) }
  }

  return null
}

/** Sign up + silent sign-in + session cookies in one step (checkout/home UX). */
export async function registerUser(data: SignUpData): Promise<AuthActionResult> {
  const supabase = await createClient()
  const redirectTo = getPostAuthRedirectPath(data.callbackUrl, '/')

  const earlyResult = await ensureSessionAfterSignUp(supabase, data)
  if (earlyResult) return earlyResult

  revalidateAuthSurfaces()
  return { ok: true, redirectTo }
}

/** @deprecated Prefer registerUser — kept for tests and legacy callers. */
export async function signUp(data: SignUpData): Promise<AuthActionResult> {
  return registerUser(data)
}

export async function signIn(data: SignInData): Promise<AuthActionResult> {
  const supabase = await createClient()
  const requestedRedirect = getPostAuthRedirectPath(data.callbackUrl, '/')

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { error: mapAuthErrorMessage(error.message) }
  }

  revalidateAuthSurfaces()

  // Platform staff land in the admin panel by default, unless they were
  // following an explicit internal deep link elsewhere.
  const userId = signInData.user?.id
  if (userId && (!data.callbackUrl || requestedRedirect === '/')) {
    const role = await getUserRoleByUserId(userId)
    if (isStaff(role)) {
      return { ok: true, redirectTo: ADMIN_DASHBOARD_PATH }
    }
  }

  return { ok: true, redirectTo: requestedRedirect }
}

export async function signOut() {
  const supabase = await createClient()
  const cookieStore = await cookies()

  await supabase.auth.signOut()

  const authCookieNames = getSupabaseAuthCookieNames(cookieStore.getAll())
  for (const name of authCookieNames) {
    cookieStore.delete(name)
  }

  revalidateAuthSurfaces()
  redirect('/')
}
