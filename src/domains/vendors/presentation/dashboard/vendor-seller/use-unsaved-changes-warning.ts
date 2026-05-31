'use client'

import { useEffect, useRef } from 'react'

export function useUnsavedChangesWarning(isDirty: boolean) {
  const allowNavigationRef = useRef(false)
  const currentUrlRef = useRef<string | null>(null)

  useEffect(() => {
    currentUrlRef.current = window.location.href
  }, [])

  useEffect(() => {
    if (!isDirty) {
      allowNavigationRef.current = false
      currentUrlRef.current = window.location.href
      return
    }

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Browser will show a generic "are you sure" dialog.
      e.preventDefault()
      e.returnValue = 'Tienes cambios sin guardar'
      return ''
    }

    const onClick = (e: MouseEvent) => {
      if (allowNavigationRef.current) return
      if (!isDirty) return

      const target = e.target as HTMLElement | null
      const link = target?.closest('a') as HTMLAnchorElement | null
      if (!link) return

      const href = link.getAttribute('href') ?? ''
      if (!href.startsWith('/')) return
      if (href === window.location.pathname) return

      e.preventDefault()

      const ok = window.confirm('Tienes cambios sin guardar')
      if (!ok) return

      allowNavigationRef.current = true
      window.location.assign(href)
    }

    const onPopState = () => {
      if (allowNavigationRef.current) {
        allowNavigationRef.current = false
        currentUrlRef.current = window.location.href
        return
      }

      const ok = window.confirm('Tienes cambios sin guardar')
      if (!ok) {
        // Revert to the last known URL.
        if (currentUrlRef.current) window.history.pushState(null, '', currentUrlRef.current)
      } else {
        currentUrlRef.current = window.location.href
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
    }
  }, [isDirty])
}

