import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/shared/types/supabase'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'
import { sanitizeSupabaseAuthCookies } from './sanitize-auth-cookies'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          const { sanitized } = sanitizeSupabaseAuthCookies(cookieStore.getAll())
          return sanitized
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component: no cookie writes — middleware refreshes the session.
          }
        },
      },
    },
  )
}
