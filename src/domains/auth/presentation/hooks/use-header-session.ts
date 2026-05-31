'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { createClient } from '@/shared/database/supabase/client'
import { AUTH_SESSION_SYNC_EVENT } from '@/domains/auth/domain/auth/session-sync'

export type HeaderSession = {
  isAuthenticated: boolean
  isSeller: boolean
  isLoading: boolean
}

export function useHeaderSession(): HeaderSession {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const syncSession = useCallback(async () => {
    const supabase = createClient()

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user =
        session?.user ??
        (
          await supabase.auth.getUser()
        ).data.user

      if (!user) {
        setIsAuthenticated(false)
        setIsSeller(false)
        return
      }

      setIsAuthenticated(true)

      const { data: storeRow, error } = await supabase
        .from('store')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      setIsSeller(Boolean(storeRow) && !error)
    } catch {
      setIsAuthenticated(false)
      setIsSeller(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    void syncSession()

    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setIsAuthenticated(false)
        setIsSeller(false)
        setIsLoading(false)
        return
      }

      setIsAuthenticated(true)
      setIsLoading(true)
      void syncSession()
    })

    const onBroadcast = () => {
      void syncSession()
    }

    window.addEventListener(AUTH_SESSION_SYNC_EVENT, onBroadcast)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener(AUTH_SESSION_SYNC_EVENT, onBroadcast)
    }
  }, [syncSession])

  // Re-sync after auth redirects (e.g. signup → checkout).
  useEffect(() => {
    void syncSession()
  }, [pathname, syncSession])

  return { isAuthenticated, isSeller, isLoading }
}
