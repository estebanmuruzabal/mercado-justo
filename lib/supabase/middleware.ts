import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicConfig } from './config'
import { sanitizeSupabaseAuthCookies } from './sanitize-auth-cookies'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!hasSupabasePublicConfig()) {
    // Si falta configuración, no rompemos el render de rutas públicas.
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
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options?: unknown
          }>,
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
            supabaseResponse = NextResponse.next({ request })
            supabaseResponse.cookies.set(name, value)
          })
        },
      },
    })

    // This will refresh session if expired - required for Server Components
    await supabase.auth.getUser()
  } catch {
    // Para usuarios guest / cookies corruptas: no queremos que un fallo de sesión rompa la app.
  }

  return supabaseResponse
}