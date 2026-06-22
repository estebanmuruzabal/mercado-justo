'use client'

import { useCallback, useEffect, useRef } from 'react'

export function usePolling(callback: () => void | Promise<void>, intervalMs = 10_000, enabled = true) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const tick = () => {
      if (cancelled || document.hidden) return
      void callbackRef.current()
    }

    tick()
    const interval = window.setInterval(tick, intervalMs)

    const onVisibility = () => {
      if (!document.hidden) tick()
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, intervalMs])
}

export function usePollingQuery<T>(
  fetcher: () => Promise<T>,
  intervalMs = 10_000,
  enabled = true,
) {
  const fetcherStable = useCallback(async () => {
    await fetcher()
  }, [fetcher])

  usePolling(fetcherStable, intervalMs, enabled)
}
