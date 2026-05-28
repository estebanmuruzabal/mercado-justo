'use server'

import { ROLES } from '@/lib/roles'
import { mapAuthErrorMessage } from '@/lib/auth/errors'
import { getPostAuthRedirectPath } from '@/lib/auth/callback-url'
import { createClient } from '@/lib/supabase/server'
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

export type AuthActionResult =
  | { ok: true; redirectTo: string }
  | { error: string }
  | { needsEmailConfirmation: true; message: string }

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

  const needsEmailConfirmation = authData.user && !authData.user.email_confirmed_at
  if (needsEmailConfirmation) {
    return {
      needsEmailConfirmation: true,
      message:
        'Cuenta creada. Revisá tu email para confirmarla y después podés iniciar sesión.',
    }
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
  const redirectTo = getPostAuthRedirectPath(data.callbackUrl, '/')

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { error: mapAuthErrorMessage(error.message) }
  }

  revalidateAuthSurfaces()
  return { ok: true, redirectTo }
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
