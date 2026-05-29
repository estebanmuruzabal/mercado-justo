'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useState } from 'react'
import { Bell, LayoutDashboard, Package, ShoppingBag, Store, Tags } from 'lucide-react'

import {
  VENDOR_CATEGORIES_PATH,
  VENDOR_DASHBOARD_PATH,
  VENDOR_LISTINGS_PATH,
  VENDOR_NOTIFICATIONS_PATH,
  VENDOR_SALES_PATH,
  VENDOR_SELLER_PATH,
} from '@/lib/routes'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { href: VENDOR_DASHBOARD_PATH, label: 'Overview', icon: LayoutDashboard },
  { href: VENDOR_SELLER_PATH, label: 'Modo vendedor', icon: Store },
  { href: VENDOR_LISTINGS_PATH, label: 'Mis Listings', icon: Package },
  { href: VENDOR_SALES_PATH, label: 'Ventas', icon: ShoppingBag },
  { href: VENDOR_CATEGORIES_PATH, label: 'Categorías', icon: Tags },
  { href: VENDOR_NOTIFICATIONS_PATH, label: 'Notificaciones', icon: Bell },
]

export function VendorSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(href: string) {
    if (href === VENDOR_DASHBOARD_PATH) {
      return pathname === VENDOR_DASHBOARD_PATH
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside
      className={cn(
        'hidden md:flex sticky top-0 h-screen flex-col border-r bg-background/80 backdrop-blur transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[240px]',
      )}
    >
      <div className='flex flex-1 flex-col gap-2 p-3'>
        <div className='px-2 pb-2'>
          <div className='flex items-center justify-between gap-2'>
            <div className={cn('text-sm font-semibold text-neutral-900', collapsed ? 'hidden' : 'block')}>Vendor panel</div>
            <button
              type='button'
              onClick={() => setCollapsed((v) => !v)}
              className={cn('rounded-md p-1 hover:bg-muted/80 lg:hidden', collapsed ? 'mx-auto' : '')}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className='block text-xs font-semibold text-neutral-900'>{collapsed ? '»' : '«'}</span>
            </button>
          </div>
          <div className={cn('text-xs text-muted-foreground', collapsed ? 'hidden' : 'block')}>Gestioná tu negocio</div>
        </div>

        <nav className='flex flex-col gap-1'>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className='h-4 w-4' />
                <span className={cn('whitespace-nowrap', collapsed ? 'hidden' : 'block')}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={cn('mt-auto px-2 pb-2 text-xs text-muted-foreground', collapsed ? 'hidden' : 'block')}>
          Tip: usá el sidebar para navegar
        </div>
      </div>
    </aside>
  )
}

