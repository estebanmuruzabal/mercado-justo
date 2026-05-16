'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import type { NavbarListingType } from './types'

type Tab = { id: NavbarListingType; label: string }

export function NavbarTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[]
  active: NavbarListingType
  onChange: (id: NavbarListingType) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  const activeTab = useMemo(() => tabs.find((t) => t.id === active), [tabs, active])

  useLayoutEffect(() => {
    const container = containerRef.current
    const activeEl = tabRefs.current[active]

    if (!container || !activeEl) return

    const containerRect = container.getBoundingClientRect()
    const elRect = activeEl.getBoundingClientRect()

    setIndicator({
      left: elRect.left - containerRect.left,
      width: elRect.width,
    })
  }, [active, activeTab?.id, tabs.length])

  useLayoutEffect(() => {
    function handleResize() {
      const container = containerRef.current
      const activeEl = tabRefs.current[active]
      if (!container || !activeEl) return

      const containerRect = container.getBoundingClientRect()
      const elRect = activeEl.getBoundingClientRect()
      setIndicator({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [active])

  return (
    <div ref={containerRef} className='relative flex items-center gap-3'>
      <div
        aria-hidden
        className='pointer-events-none absolute -bottom-3 h-0.5 bg-foreground transition-[transform,width] duration-300'
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: indicator.width,
        }}
      />

      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el
            }}
            type='button'
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative rounded-full px-2.5 py-1 text-sm font-medium transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

