'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { MercadoJustoLogo } from '@/shared/shell/navbar/left/AirbnbLogo'
import { UserMenu } from '@/shared/shell/navbar/right/UserMenu'
import { type TabId, TABS, type SearchPayload } from '@/shared/shell/navbar/right/airbnbTabs'
import { MarketplaceFiltersBar } from '@/domains/marketplace/listings/presentation/marketplace/filters/MarketplaceFiltersBar'
import { useEffect, useRef } from 'react'
import { tabUnderlineVariants, tabLabelVariants } from '@/shared/motion/navbar-motion'
import { useMarketplaceFiltersStore } from '@/domains/marketplace/listings/presentation/stores/useMarketplaceFiltersStore'
import { useHeaderSession } from '@/domains/auth/presentation/hooks/use-header-session'
import { BECOME_VENDOR_PATH, VENDOR_DASHBOARD_PATH } from '@/shared/routing/routes'
import { useUnreadNotifications } from '@/domains/community/notifications/presentation/hooks/notifications/use-unread-notifications'
import { CartButton } from './cart-button'
import { NotificationButton } from './notification-button'
import { MenuButton } from './menu-button'
import { NotificationsPanel } from './notifications-panel'

export function DesktopNav({
  brand,
  scrolled,
  activeTab,
  onSelectTab,
  onSearch,
  userMenuOpen,
  setUserMenuOpen,
  notificationsOpen,
  setNotificationsOpen,
  onMenuAction,
  cartItemCount,
  showCartBadge,
  onOpenCart,
}: {
  brand: string
  scrolled: boolean
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  onSearch: (payload: SearchPayload) => void
  userMenuOpen: boolean
  setUserMenuOpen: (v: boolean) => void
  notificationsOpen: boolean
  setNotificationsOpen: (v: boolean) => void
  onMenuAction?: (action: string) => void
  cartItemCount: number
  showCartBadge: boolean
  onOpenCart: () => void
}) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const notificationsRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const isBrowsePage = pathname === '/'
  const radiusKm = useMarketplaceFiltersStore((s) => s.radiusKm)
  const { isAuthenticated, isSeller, isLoading } = useHeaderSession()
  const notificationAudience = isSeller ? 'vendor' : 'buyer'
  const { unreadCount, bellPulseToken } = useUnreadNotifications(notificationAudience)
  const displayUnread = isAuthenticated ? unreadCount : 0

  useEffect(() => {
    if (!userMenuOpen && !notificationsOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if ((target as Element).closest('[data-header-actions]')) return
      if (menuRef.current?.contains(target) || notificationsRef.current?.contains(target)) return
      setUserMenuOpen(false)
      setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [userMenuOpen, notificationsOpen, setUserMenuOpen, setNotificationsOpen])

  const toggleMenu = () => {
    setNotificationsOpen(false)
    setUserMenuOpen(!userMenuOpen)
  }

  const toggleNotifications = () => {
    setUserMenuOpen(false)
    setNotificationsOpen(!notificationsOpen)
  }

  return (
    <div className='hidden lg:block'>
      <div className='flex items-center justify-between py-3'>
        <Link href='/' className='flex items-center gap-1 text-[#FF385C]'>
          <MercadoJustoLogo />
          {!scrolled ? <span className='text-2xl font-semibold tracking-tight'>{brand}</span> : null}
        </Link>

        {!scrolled ? (
          <nav className='flex items-center gap-2'>
            {TABS.map((t) => (
              <div key={t.id} className='relative'>
                <button
                  type='button'
                  disabled={t.isNew}
                  onClick={() => onSelectTab(t.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 transition-colors ${
                    activeTab === t.id ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  aria-current={activeTab === t.id ? 'page' : undefined}
                >
                  <span className='relative text-2xl'>
                    <span aria-hidden='true'>{t.emoji}</span>
                    {t.isNew ? (
                      <span className='absolute -right-8 -top-2 rounded-md bg-[#2B3A55] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white'>
                        Proximamente
                      </span>
                    ) : null}
                  </span>
                  <motion.span
                    variants={tabLabelVariants}
                    initial={false}
                    animate={activeTab === t.id ? 'active' : 'inactive'}
                    className={activeTab === t.id ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-500'}
                  >
                    {t.label}
                  </motion.span>
                  <motion.span
                    aria-hidden='true'
                    className='absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-neutral-900'
                    variants={tabUnderlineVariants}
                    initial={false}
                    animate={activeTab === t.id ? 'active' : 'inactive'}
                    style={{ transformOrigin: 'center' }}
                  />
                </button>
              </div>
            ))}
          </nav>
        ) : null}

        {scrolled && isBrowsePage ? (
          <div className='flex-1 flex justify-center px-4'>
            <MarketplaceFiltersBar layout='collapsed' />
          </div>
        ) : null}

        {scrolled && !isBrowsePage ? (
          <button
            type='button'
            onClick={() =>
              onSearch({
                tab: activeTab,
                place: '',
                dates: `${radiusKm} km`,
                guests: '',
              })
            }
            className='flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow'
          >
            <span className='px-4 text-sm font-medium text-neutral-900 flex items-center gap-2'>
              <span aria-hidden='true'>📍</span> Buscar
            </span>
            <span className='h-5 w-px bg-neutral-200' />
            <span className='px-4 text-sm font-medium text-neutral-900'>Radio {radiusKm} km</span>
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              aria-label='Buscar'
              className='flex h-8 w-8 items-center justify-center rounded-full bg-[#FF385C] text-white cursor-pointer'
            >
              <Search className='h-4 w-4' />
            </motion.span>
          </button>
        ) : null}

        <div className='relative flex items-center gap-2' data-header-actions>
          {isLoading ? null : !isAuthenticated ? (
            <Link
              href={BECOME_VENDOR_PATH}
              className='hidden xl:block rounded-full px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100'
            >
              Become a seller
            </Link>
          ) : isSeller ? (
            <Link
              href={VENDOR_DASHBOARD_PATH}
              className='hidden xl:block rounded-full px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100'
            >
              Panel Vendedor
            </Link>
          ) : (
            <Link
              href={BECOME_VENDOR_PATH}
              className='hidden xl:block rounded-full px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100'
            >
              Become a seller
            </Link>
          )}

          <CartButton itemCount={cartItemCount} showBadge={showCartBadge} onClick={onOpenCart} />

          {isAuthenticated ? (
            <NotificationButton
              unreadCount={displayUnread}
              showBadge={showCartBadge}
              isActive={notificationsOpen}
              bellPulseToken={bellPulseToken}
              onClick={toggleNotifications}
            />
          ) : null}

          <MenuButton isActive={userMenuOpen} onClick={toggleMenu} />

          <AnimatePresence>
            {notificationsOpen && isAuthenticated ? (
              <motion.div
                ref={notificationsRef}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
                className='absolute right-0 top-full z-50 mt-2'
              >
                <NotificationsPanel isSeller={isSeller} onClose={() => setNotificationsOpen(false)} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {userMenuOpen ? (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
                className='absolute right-0 top-full z-50 mt-2'
              >
                <UserMenu
                  onClose={() => setUserMenuOpen(false)}
                  onAction={(a) => onMenuAction?.(a)}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {!scrolled ? (
        <div className='pb-5'>
          {isBrowsePage ? (
            <MarketplaceFiltersBar layout='desktop' />
          ) : (
            <div className='text-center text-sm text-neutral-500'>
              Búsqueda disponible en el inicio
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
