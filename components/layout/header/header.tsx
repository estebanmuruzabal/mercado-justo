'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { SearchPayload, TabId } from '@/components/features/navbar/right/airbnbTabs'
import { DesktopNav } from './desktop-nav'
import { MobileNav } from './mobile-nav'
import { MobileDrawer } from './mobile-drawer'
import { springSoft } from '@/lib/motion/transitions'
import { LocationSelectorTrigger } from '@/components/location/location-selector-trigger'

export interface HeaderProps {
  onSearch?: (payload: SearchPayload) => void
  onTabChange?: (tab: TabId) => void
  onMenuAction?: (action: string) => void
  defaultTab?: TabId
  avatarUrl?: string
  brand?: string
}

export default function Header({
  onSearch,
  onTabChange,
  onMenuAction,
  defaultTab = 'product',
  avatarUrl,
  brand = 'mercado justo',
}: HeaderProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const lastFocusedElRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const isAnyOpen = mobileDrawerOpen || mobileSearchOpen
    if (!isAnyOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (mobileSearchOpen) setMobileSearchOpen(false)
      else setMobileDrawerOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileDrawerOpen, mobileSearchOpen])

  useEffect(() => {
    // Restore focus after closing overlays.
    if (mobileDrawerOpen || mobileSearchOpen) return
    const el = lastFocusedElRef.current
    el?.focus?.()
    lastFocusedElRef.current = null
  }, [mobileDrawerOpen, mobileSearchOpen])

  const selectTab = (id: TabId) => {
    setActiveTab(id)
    onTabChange?.(id)
  }

  const handleSearch = (payload: SearchPayload) => {
    onSearch?.(payload)
  }

  return (
    <motion.header
      className='sticky top-0 z-40 w-full border-b border-neutral-200 relative'
      initial={false}
      animate={{}}
    >
      <motion.div
        className='pointer-events-none absolute inset-0 bg-white/80 backdrop-blur-md'
        initial={{ opacity: 0 }}
        animate={{ opacity: scrolled ? 1 : 0 }}
        transition={springSoft}
      />

      <div className='relative mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-10'>
        <DesktopNav
          brand={brand}
          avatarUrl={avatarUrl}
          scrolled={scrolled}
          activeTab={activeTab}
          onSelectTab={selectTab}
          onSearch={handleSearch}
          userMenuOpen={userMenuOpen}
          setUserMenuOpen={setUserMenuOpen}
          onMenuAction={onMenuAction}
        />

        <MobileNav
          brand={brand}
          avatarUrl={avatarUrl}
          scrolled={scrolled}
          activeTab={activeTab}
          onSelectTab={selectTab}
          onOpenMobileMenu={() => {
            lastFocusedElRef.current = document.activeElement as HTMLElement | null
            setMobileDrawerOpen(true)
          }}
          onOpenMobileSearch={() => {
            lastFocusedElRef.current = document.activeElement as HTMLElement | null
            setMobileDrawerOpen(false)
            setMobileSearchOpen(true)
          }}
          mobileSearchOpen={mobileSearchOpen}
          onMobileSearchClose={() => setMobileSearchOpen(false)}
          onSearch={handleSearch}
        />
      </div>

      {/* Sticky subheader for Delivery/Pickup location */}
      <div
        className='border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70'
      >
        <div className='mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-10 py-2'>
          <LocationSelectorTrigger />
        </div>
      </div>

      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onMenuAction={onMenuAction}
      />
    </motion.header>
  )
}

