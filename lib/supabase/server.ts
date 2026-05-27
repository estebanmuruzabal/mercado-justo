import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'
import { sanitizeSupabaseAuthCookies } from './sanitize-auth-cookies'

export const createClient = async () => {
  const cookieStore = await cookies()
  const cookieSnapshot = cookieStore.getAll()
  const { sanitized } = sanitizeSupabaseAuthCookies(cookieSnapshot)
  const sanitizedCookieStore = {
    getAll: () => sanitized,
    setAll: cookieStore.set,
  }
  
  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll: () => sanitizedCookieStore.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string }>) => {
          cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value))
        },
      },
    }
  )
}