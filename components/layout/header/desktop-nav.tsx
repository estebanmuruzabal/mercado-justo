'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Menu, Search, ShoppingCart } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { MercadoJustoLogo } from '@/components/features/navbar/left/AirbnbLogo'
import { UserMenu } from '@/components/features/navbar/right/UserMenu'
import { type TabId, TABS, type SearchPayload } from '@/components/features/navbar/right/airbnbTabs'
import { MarketplaceFiltersBar } from '@/components/marketplace/filters/MarketplaceFiltersBar'
import { useEffect, useRef, useState } from 'react'
import { tabUnderlineVariants, tabLabelVariants } from '@/lib/motion/navbar-motion'
import { useMarketplaceFiltersStore } from '@/stores/useMarketplaceFiltersStore'
import { createClient } from '@/lib/supabase/client'
import { CartDrawer } from '@/components/features/cart-drawer/cart-drawer'
import { useCartStore } from '@/stores/cart-store/cart-store'

export function DesktopNav({
  brand,
  avatarUrl,
  scrolled,
  activeTab,
  onSelectTab,
  onSearch,
  userMenuOpen,
  setUserMenuOpen,
  onMenuAction,
}: {
  brand: string
  avatarUrl?: string
  scrolled: boolean
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  onSearch: (payload: SearchPayload) => void
  userMenuOpen: boolean
  setUserMenuOpen: (v: boolean) => void
  onMenuAction?: (action: string) => void
}) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const isBrowsePage = pathname === '/'
  const radiusKm = useMarketplaceFiltersStore((s) => s.radiusKm)
  const [isSeller, setIsSeller] = useState(false)
  const [checkingSeller, setCheckingSeller] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const { itemCount } = useCartStore()

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (!cancelled) setIsSeller(false)
          return
        }

        const { data: storeRow, error } = await supabase
          .from('store')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!cancelled) setIsSeller(Boolean(storeRow) && !error)
      } catch {
        if (!cancelled) setIsSeller(false)
      } finally {
        if (!cancelled) setCheckingSeller(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!userMenuOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (!menuRef.current) return
      const target = e.target as Node
      if (!menuRef.current.contains(target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [userMenuOpen, setUserMenuOpen])

  return (
    <div className='hidden lg:block'>
      <div className='flex items-center justify-between py-3'>
        {/* Brand */}
        <Link href='/' className='flex items-center gap-1 text-[#FF385C]'>
          <MercadoJustoLogo />
          {!scrolled ? <span className='text-2xl font-semibold tracking-tight'>{brand}</span> : null}
        </Link>

        {/* Tabs (centered, hidden when scrolled) */}
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

        {/* Collapsed pill */}
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

        {/* Right side */}
        <div className='flex items-center gap-2'>
          {checkingSeller ? (
            <span className='hidden xl:block rounded-full px-4 py-2 text-sm font-medium text-neutral-900'>
              Convertite en vendedor
            </span>
          ) : isSeller ? (
            <Link
              href='/dashboard-vendor/listings'
              className='hidden xl:block rounded-full px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100'
            >
              vendor panel
            </Link>
          ) : (
            <Link
              href='/dashboard-vendor/seller'
              className='hidden xl:block rounded-full px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100'
            >
              Convertite en vendedor
            </Link>
          )}
          <UserMenuTrigger
            avatarUrl={avatarUrl}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            itemCount={itemCount}
            onOpenCart={() => setCartOpen(true)}
          />

          <AnimatePresence>
            {userMenuOpen ? (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
                className='absolute right-6 top-16 z-50'
              >
                <UserMenu
                  onClose={() => setUserMenuOpen(false)}
                  onAction={(a) => onMenuAction?.(a)}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {cartOpen ? <CartDrawer onClose={() => setCartOpen(false)} /> : null}
        </div>
      </div>

      {/* Expanded filter bar */}
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

function UserMenuTrigger({
  avatarUrl,
  onClick,
  itemCount,
  onOpenCart,
}: {
  avatarUrl?: string
  onClick: () => void
  itemCount: number
  onOpenCart: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-1.5 hover:shadow-md transition-shadow'
      aria-label='Menú de usuario'
    >
      <span
        role='button'
        tabIndex={0}
        aria-label='Abrir carrito'
        onClick={(e) => {
          e.stopPropagation()
          onOpenCart()
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          e.stopPropagation()
          onOpenCart()
        }}
        className='relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 cursor-pointer'
      >
        <ShoppingCart className='h-4 w-4 text-neutral-900' aria-hidden='true' />
        {itemCount > 0 ? (
          <span className='absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF385C] px-1 text-xs font-bold text-white'>
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        ) : null}
      </span>
      <Avatar avatarUrl={avatarUrl} />
      <span className='flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100'>
        <Menu className='h-4 w-4 text-neutral-900' aria-hidden='true' />
      </span>
    </button>
  )
}

function Avatar({ avatarUrl }: { avatarUrl?: string }) {
  return (
    <span className='block h-8 w-8 overflow-hidden rounded-full bg-neutral-200'>
      {avatarUrl ? (
        <img src={avatarUrl} alt='Perfil' className='h-full w-full object-cover' />
      ) : (
        <span className='flex h-full w-full items-center justify-center text-neutral-500'>👤</span>
      )}
    </span>
  )
}

