'use client'

import { useRouter } from 'next/navigation'

import { broadcastAuthSessionSync } from '@/lib/auth/session-sync'
import { createClient } from '@/lib/supabase/client'
import type { AuthActionResult } from '@/server/actions/auth'

export function useAuthNavigation() {
  const router = useRouter()

  const completeAuth = async (result: AuthActionResult | undefined) => {
    if (!result) return { handled: false as const }

    if ('error' in result && result.error) {
      return { handled: true as const, error: result.error }
    }

    if ('ok' in result && result.ok) {
      const supabase = createClient()
      await supabase.auth.getSession()
      broadcastAuthSessionSync()
      router.push(result.redirectTo)
      router.refresh()
      return { handled: true as const, ok: true as const }
    }

    return { handled: false as const }
  }

  return { completeAuth }
}
