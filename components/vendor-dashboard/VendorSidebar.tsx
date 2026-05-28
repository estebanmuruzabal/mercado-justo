'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useState } from 'react'
import { Bell, Package, ShoppingBag, Store, Tags } from 'lucide-react'

import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard-vendor/seller', label: 'Modo vendedor', icon: Store },
  { href: '/dashboard-vendor/listings', label: 'Mis Listings', icon: Package },
  { href: '/dashboard-vendor/ventas', label: 'Ventas', icon: ShoppingBag },
  { href: '/dashboard-vendor/categorias', label: 'Categorías', icon: Tags },
  { href: '/dashboard-vendor/notifications', label: 'Notificaciones', icon: Bell },
]

export function VendorSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(href: string) {
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

