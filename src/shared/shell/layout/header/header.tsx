'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { SearchPayload, TabId } from '@/shared/shell/navbar/right/airbnbTabs'
import { DesktopNav } from './desktop-nav'
import { MobileNav } from './mobile-nav'
import { MobileDrawer } from './mobile-drawer'
import { springSoft } from '@/shared/motion/transitions'
import { LocationSelectorTrigger } from '@/shared/maps/location/presentation/location-selector-trigger'
import { CartDrawer } from '@/domains/marketplace/checkout/presentation/cart-drawer/cart-drawer'
import { useCartStore } from '@/domains/marketplace/checkout/presentation/stores/cart-store/cart-store'
import { useRequireReceiveMode } from '@/shared/maps/location/presentation/hooks/use-require-receive-mode'
import { useHeaderSession } from '@/domains/auth/presentation/hooks/use-header-session'
import { usePathname } from 'next/navigation'

export interface HeaderProps {
  onSearch?: (payload: SearchPayload) => void
  onTabChange?: (tab: TabId) => void
  onMenuAction?: (action: string) => void
  defaultTab?: TabId
  brand?: string
}

export default function Header({
  onSearch,
  onTabChange,
  onMenuAction,
  defaultTab = 'product',
  brand = 'mercado justo',
}: HeaderProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { itemCount } = useCartStore()
  const pathname = usePathname()
  const isBrowsePage = pathname === '/'
  const { hasReceiveMode, promptReceiveMode } = useRequireReceiveMode()
  const { isAuthenticated } = useHeaderSession()

  const lastFocusedElRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationsOpen(false)
      setUserMenuOpen(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const isAnyOpen = mobileDrawerOpen || mobileSearchOpen || notificationsOpen
    if (!isAnyOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (mobileSearchOpen) setMobileSearchOpen(false)
      else if (notificationsOpen) setNotificationsOpen(false)
      else setMobileDrawerOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileDrawerOpen, mobileSearchOpen, notificationsOpen])

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
          scrolled={scrolled}
          activeTab={activeTab}
          onSelectTab={selectTab}
          onSearch={handleSearch}
          userMenuOpen={userMenuOpen}
          setUserMenuOpen={setUserMenuOpen}
          notificationsOpen={notificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          onMenuAction={onMenuAction}
          cartItemCount={itemCount}
          showCartBadge={mounted}
          onOpenCart={() => {
            setNotificationsOpen(false)
            setUserMenuOpen(false)
            setCartOpen(true)
          }}
        />

        <MobileNav
          scrolled={scrolled}
          activeTab={activeTab}
          onSelectTab={selectTab}
          cartItemCount={itemCount}
          showCartBadge={mounted}
          onOpenCart={() => {
            setNotificationsOpen(false)
            setCartOpen(true)
          }}
          notificationsOpen={notificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          onOpenMobileMenu={() => {
            setNotificationsOpen(false)
            lastFocusedElRef.current = document.activeElement as HTMLElement | null
            setMobileDrawerOpen(true)
          }}
          onOpenMobileSearch={() => {
            if (isBrowsePage && !hasReceiveMode) {
              promptReceiveMode()
              return
            }
            lastFocusedElRef.current = document.activeElement as HTMLElement | null
            setMobileDrawerOpen(false)
            setMobileSearchOpen(true)
          }}
          mobileSearchOpen={mobileSearchOpen}
          onMobileSearchClose={() => setMobileSearchOpen(false)}
          onSearch={handleSearch}
        />
      </div>

      {cartOpen ? <CartDrawer onClose={() => setCartOpen(false)} /> : null}

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

