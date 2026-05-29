'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { CheckoutAuthView } from '@/components/features/auth/checkout-auth-panel'
import { createClient } from '@/lib/supabase/client'
import { CHECKOUT_PATH } from '@/lib/auth/checkout'

export function useCheckoutGuard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [authView, setAuthView] = useState<CheckoutAuthView>('prompt')

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (cancelled) return
        setIsAuthenticated(Boolean(data.user))
      })
      .catch(() => {
        if (cancelled) return
        setIsAuthenticated(false)
      })
      .finally(() => {
        if (cancelled) return
        setIsCheckingAuth(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setIsAuthenticated(Boolean(session?.user))
      setIsCheckingAuth(false)
      if (session?.user) {
        setAuthPromptOpen(false)
        setAuthView('prompt')
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const goToCheckout = () => {
    if (isCheckingAuth) return false

    if (isAuthenticated) {
      router.push(CHECKOUT_PATH)
      return true
    }

    setAuthView('signup')
    setAuthPromptOpen(true)
    return false
  }

  const openCheckoutAuth = (action: 'signin' | 'signup') => {
    setAuthView(action)
    setAuthPromptOpen(true)
  }

  const resetAuthPrompt = () => {
    setAuthPromptOpen(false)
    setAuthView('prompt')
  }

  return {
    isAuthenticated,
    isCheckingAuth,
    authPromptOpen,
    setAuthPromptOpen,
    authView,
    setAuthView,
    goToCheckout,
    openCheckoutAuth,
    resetAuthPrompt,
  }
}
