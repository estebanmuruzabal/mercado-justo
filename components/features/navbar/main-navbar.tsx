'use client'

import { useEffect, useMemo, useState } from 'react'

import type { NavbarListingType } from './types'
import { NAVBAR_TABS } from './types'
import { NavbarTabs } from './navbar-tabs'
import { AnimatedSearchArea } from './animated-search-area'
import { NavbarCartButton } from './navbar-cart-button'
import { NavbarProfileMenu } from './navbar-profile-menu'
import { CartDrawer } from '@/components/features/cart-drawer/cart-drawer'
import { LISTING_TYPE_LABELS } from '@/lib/listing'

export function MainNavbar({ email }: { email?: string }) {
  const [activeListingType, setActiveListingType] = useState<NavbarListingType>('product')
  const [isCompact, setIsCompact] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      const next = window.scrollY > 24
      setIsCompact(next)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const activeLabel = useMemo(() => {
    const tab = NAVBAR_TABS.find((t) => t.id === activeListingType)
    return tab?.label ?? LISTING_TYPE_LABELS.product
  }, [activeListingType])

  return (
    <header
      className={
        'sticky top-0 z-20 border-b bg-background/95 backdrop-blur transition-all duration-300 ' +
        (isCompact ? 'py-2' : 'py-6')
      }
    >
      <div className='mx-auto w-full max-w-7xl px-6'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='text-lg font-bold tracking-tight'>Mercado Justo</div>
          </div>

          <div className='hidden flex-1 items-center justify-center lg:flex'>
            <NavbarTabs tabs={NAVBAR_TABS} active={activeListingType} onChange={setActiveListingType} />
          </div>

          <div className='flex items-center gap-2'>
            <div className='lg:hidden'>
              <NavbarTabs tabs={NAVBAR_TABS} active={activeListingType} onChange={setActiveListingType} />
            </div>

            <NavbarCartButton onOpen={() => setCartOpen(true)} />
            <NavbarProfileMenu email={email} />
          </div>
        </div>

        <div className='mt-4 lg:mt-6'>
          <AnimatedSearchArea activeListingType={activeListingType} isCompact={isCompact} />
          <div className='mt-2 text-xs text-muted-foreground'>
            Active: {activeLabel} (future search wiring)
          </div>
        </div>
      </div>

      {cartOpen ? <CartDrawer onClose={() => setCartOpen(false)} /> : null}
    </header>
  )
}

