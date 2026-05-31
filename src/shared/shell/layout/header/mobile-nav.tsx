'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { TABS, type TabId, type SearchPayload } from '@/shared/shell/navbar/right/airbnbTabs'
import { MercadoJustoLogo } from '@/shared/shell/navbar/left/AirbnbLogo'
import { MarketplaceFiltersModal } from '@/domains/marketplace/listings/presentation/marketplace/filters/MarketplaceFiltersModal'
import { NavItem } from './nav-item'
import { CartButton } from './cart-button'
import { NotificationButton } from './notification-button'
import { MenuButton } from './menu-button'
import { NotificationsPanel } from './notifications-panel'
import { useHeaderSession } from '@/domains/auth/presentation/hooks/use-header-session'
import { useUnreadNotifications } from '@/domains/community/notifications/presentation/hooks/notifications/use-unread-notifications'

export function MobileNav({
  scrolled,
  activeTab,
  onSelectTab,
  cartItemCount,
  showCartBadge,
  onOpenCart,
  onOpenMobileMenu,
  onOpenMobileSearch,
  mobileSearchOpen,
  onMobileSearchClose,
  notificationsOpen,
  setNotificationsOpen,
}: {
  scrolled: boolean
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  cartItemCount: number
  showCartBadge: boolean
  onOpenCart: () => void
  onOpenMobileMenu: () => void
  onOpenMobileSearch: () => void
  mobileSearchOpen: boolean
  onMobileSearchClose: () => void
  onSearch: (payload: SearchPayload) => void
  notificationsOpen: boolean
  setNotificationsOpen: (v: boolean) => void
}) {
  const pathname = usePathname()
  const isBrowsePage = pathname === '/'
  const notificationsRef = useRef<HTMLDivElement | null>(null)
  const { isAuthenticated, isSeller } = useHeaderSession()
  const notificationAudience = isSeller ? 'vendor' : 'buyer'
  const { unreadCount, bellPulseToken } = useUnreadNotifications(notificationAudience)
  const displayUnread = isAuthenticated ? unreadCount : 0

  useEffect(() => {
    if (!notificationsOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if ((target as Element).closest('[data-header-actions]')) return
      if (notificationsRef.current?.contains(target)) return
      setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [notificationsOpen, setNotificationsOpen])

  return (
    <div className='relative lg:hidden py-2'>
      <div className='flex items-center gap-2' data-header-actions>
        <button
          type='button'
          onClick={onOpenMobileSearch}
          className='flex min-w-0 flex-1 items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]'
          aria-label='Abrir búsqueda'
        >
          <span className='flex h-8 w-8 items-center justify-center rounded-full bg-[#FF385C]/10 text-[#FF385C]'>
            <MercadoJustoLogo small />
          </span>
          <span className='flex min-w-0 items-center gap-2 text-sm font-semibold text-neutral-900'>
            <Search className='h-4 w-4 shrink-0' />
            <span className='truncate'>{isBrowsePage ? 'Filtros y búsqueda' : 'Empezá tu búsqueda'}</span>
          </span>
        </button>

        <CartButton itemCount={cartItemCount} showBadge={showCartBadge} onClick={onOpenCart} />

        {isAuthenticated ? (
          <NotificationButton
            unreadCount={displayUnread}
            showBadge={showCartBadge}
            isActive={notificationsOpen}
            bellPulseToken={bellPulseToken}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          />
        ) : null}

        <MenuButton onClick={onOpenMobileMenu} />
      </div>

      <AnimatePresence>
        {notificationsOpen && isAuthenticated ? (
          <motion.div
            ref={notificationsRef}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
            className='absolute right-0 top-full z-50 mt-2'
          >
            <NotificationsPanel isSeller={isSeller} onClose={() => setNotificationsOpen(false)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className='mt-4 flex items-start justify-around'>
        {TABS.map((t) =>
          scrolled ? (
            <button
              key={t.id}
              type='button'
              onClick={() => onSelectTab(t.id)}
              className={`text-xs pb-1 ${
                activeTab === t.id ? 'text-neutral-900 font-semibold border-b-2 border-neutral-900' : 'text-neutral-500'
              }`}
              aria-current={activeTab === t.id ? 'page' : undefined}
            >
              {t.label}
            </button>
          ) : (
            <div key={t.id}>
              <NavItem tab={t} active={activeTab === t.id} onSelect={() => onSelectTab(t.id)} orientation='vertical' />
            </div>
          )
        )}
      </div>

      <AnimatePresence>
        {mobileSearchOpen && isBrowsePage ? (
          <MarketplaceFiltersModal open={mobileSearchOpen} onClose={onMobileSearchClose} />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
