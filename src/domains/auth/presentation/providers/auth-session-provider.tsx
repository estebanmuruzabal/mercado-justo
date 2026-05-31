'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

import { broadcastAuthSessionSync } from '@/domains/auth/domain/auth/session-sync'
import { createClient } from '@/shared/database/supabase/client'

/**
 * Keeps server-rendered UI (header, protected pages) in sync after client auth changes.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      broadcastAuthSessionSync()
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return children
}
