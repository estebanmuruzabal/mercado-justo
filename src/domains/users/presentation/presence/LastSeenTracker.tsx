'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { touchUserLastSeenAction } from '@/domains/users/application/actions/touch-user-last-seen.actions'
import { createClient } from '@/shared/database/supabase/client'

const HEARTBEAT_MS = 2 * 60 * 1000

export function LastSeenTracker() {
  const pathname = usePathname()
  const lastTouchRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function touch(force = false) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || cancelled) return

      const now = Date.now()
      if (!force && now - lastTouchRef.current < HEARTBEAT_MS) return

      lastTouchRef.current = now
      try {
        await touchUserLastSeenAction()
      } catch {
        // Non-blocking presence update.
      }
    }

    void touch(true)
    const interval = window.setInterval(() => void touch(false), HEARTBEAT_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [pathname])

  return null
}
