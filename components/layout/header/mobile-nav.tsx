'use client'

import { AnimatePresence } from 'framer-motion'
import { Menu, Search, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { TABS, type TabId, type SearchPayload } from '@/components/features/navbar/right/airbnbTabs'
import { MercadoJustoLogo } from '@/components/features/navbar/left/AirbnbLogo'
import { MarketplaceFiltersModal } from '@/components/marketplace/filters/MarketplaceFiltersModal'
import { NavItem } from './nav-item'

export function MobileNav({
  brand,
  avatarUrl,
  scrolled,
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
  onOpenMobileSearch,
  mobileSearchOpen,
  onMobileSearchClose,
}: {
  brand: string
  avatarUrl?: string
  scrolled: boolean
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  onOpenMobileMenu: () => void
  onOpenMobileSearch: () => void
  mobileSearchOpen: boolean
  onMobileSearchClose: () => void
  onSearch: (payload: SearchPayload) => void
}) {
  const pathname = usePathname()
  const isBrowsePage = pathname === '/'

  useEffect(() => {
    if (!mobileSearchOpen) return
    // No manual focus needed: CitySelector focuses its own input.
  }, [mobileSearchOpen])

  return (
    <div className='lg:hidden py-2'>
      {!scrolled ? (
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={onOpenMobileSearch}
            className='flex flex-1 items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]'
            aria-label='Abrir búsqueda'
          >
            <span className='text-[#FF385C]'>
              <MercadoJustoLogo small />
            </span>
            <span className='hidden sm:inline text-lg font-semibold text-[#FF385C]'>{brand}</span>
            <Search className='h-4 w-4 text-neutral-900 ml-2' />
            <span className='text-sm font-semibold text-neutral-900'>
              {isBrowsePage ? 'Filtros y búsqueda' : 'Empezá tu búsqueda'}
            </span>
            <span className='ml-auto flex items-center gap-2'>
              <Avatar avatarUrl={avatarUrl} />
            </span>
          </button>

          <button
            type='button'
            onClick={onOpenMobileMenu}
            className='flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100'
            aria-label='Menú'
          >
            <Menu className='h-5 w-5' />
          </button>
        </div>
      ) : (
        <>
          <button
            type='button'
            onClick={onOpenMobileSearch}
            className='flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]'
          >
            <Search className='h-4 w-4 text-neutral-900' />
            <span className='text-sm font-semibold text-neutral-900'>
              {isBrowsePage ? 'Filtros y búsqueda' : 'Empezá tu búsqueda'}
            </span>
          </button>
        </>
      )}

      {/* Tabs row */}
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

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {mobileSearchOpen && isBrowsePage ? (
          <MarketplaceFiltersModal open={mobileSearchOpen} onClose={onMobileSearchClose} />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function Avatar({ avatarUrl }: { avatarUrl?: string }) {
  return (
    <span className='block h-8 w-8 overflow-hidden rounded-full bg-neutral-200'>
      {avatarUrl ? (
        <img src={avatarUrl} alt='Perfil' className='h-full w-full object-cover' />
      ) : (
        <span className='flex h-full w-full items-center justify-center text-neutral-500'>
          <User className='h-4 w-4' />
        </span>
      )}
    </span>
  )
}

