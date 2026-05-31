import { NextResponse } from 'next/server'

import { createClient } from '@/shared/database/supabase/server'
import { SIGN_IN_PATH } from '@/shared/routing/routes'

/**
 * Supabase Auth callback — exchanges the PKCE code for a session, then redirects.
 * Used for password recovery and OAuth flows.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const safeNext = next.startsWith('/') ? next : `/${next}`
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}${SIGN_IN_PATH}?error=auth_callback`)
}
