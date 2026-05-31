import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicConfig } from './config'
import { sanitizeSupabaseAuthCookies } from './sanitize-auth-cookies'
import { HOME_PATH } from '@/shared/routing/routes'

const SUPER_ADMIN_PATHS = ['/admin/users', '/admin/vendors'] as const

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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const needsSuperAdmin = SUPER_ADMIN_PATHS.some((p) => pathname.startsWith(p))

    if (needsSuperAdmin) {
      if (!user) {
        const signInUrl = request.nextUrl.clone()
        signInUrl.pathname = '/signin'
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }

      const { data: profile } = await supabase
        .from('user')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role !== 'super-admin') {
        const homeUrl = request.nextUrl.clone()
        homeUrl.pathname = HOME_PATH
        homeUrl.search = ''
        return NextResponse.redirect(homeUrl)
      }
    }
  } catch {
    // Guest / corrupt cookies: do not break public routes.
  }

  return supabaseResponse
}
