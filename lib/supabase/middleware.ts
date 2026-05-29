import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicConfig } from './config'
import { sanitizeSupabaseAuthCookies } from './sanitize-auth-cookies'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!hasSupabasePublicConfig()) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          const all = request.cookies.getAll()
          const { sanitized, invalidCookieNames } = sanitizeSupabaseAuthCookies(all)
          for (const name of invalidCookieNames) {
            request.cookies.delete(name)
            supabaseResponse.cookies.delete(name)
          }
          return sanitized
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    })

    await supabase.auth.getUser()
  } catch {
    // Guest / corrupt cookies: do not break public routes.
  }

  return supabaseResponse
}
