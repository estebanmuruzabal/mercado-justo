'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react'

import { ADMIN_DASHBOARD_PATH } from '@/lib/routes'
import { type Permission } from '@/lib/auth/permissions'
import { visibleNavItems } from '@/components/admin/admin-nav-items'
import { cn } from '@/lib/utils'

export function AdminSidebar({ permissions }: { permissions: Permission[] }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const items = visibleNavItems(permissions)

  function isActive(href: string) {
    if (href === ADMIN_DASHBOARD_PATH) return pathname === ADMIN_DASHBOARD_PATH
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside
      className={cn(
        'hidden md:flex sticky top-0 h-screen flex-col border-r bg-background/80 backdrop-blur transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[248px]',
      )}
    >
      <div className='flex flex-1 flex-col gap-2 p-3'>
        <div className='flex items-center justify-between gap-2 px-2 pb-2'>
          <div className={cn('flex items-center gap-2', collapsed && 'mx-auto')}>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
              <ShieldCheck className='h-4 w-4' />
            </div>
            <div className={cn(collapsed ? 'hidden' : 'block')}>
              <div className='text-sm font-semibold leading-tight'>Admin Panel</div>
              <div className='text-xs text-muted-foreground'>Mercado Justo</div>
            </div>
          </div>
          <button
            type='button'
            onClick={() => setCollapsed((v) => !v)}
            className={cn('rounded-md p-1 text-muted-foreground hover:bg-muted/80', collapsed && 'hidden')}
            aria-label='Collapse sidebar'
          >
            <PanelLeftClose className='h-4 w-4' />
          </button>
        </div>

        {collapsed && (
          <button
            type='button'
            onClick={() => setCollapsed(false)}
            className='mx-auto rounded-md p-1 text-muted-foreground hover:bg-muted/80'
            aria-label='Expand sidebar'
          >
            <PanelLeftOpen className='h-4 w-4' />
          </button>
        )}

        <nav className='flex flex-col gap-1'>
          {items.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  collapsed && 'justify-center px-0',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className='h-4 w-4 shrink-0' />
                <span className={cn('whitespace-nowrap', collapsed ? 'hidden' : 'block')}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
