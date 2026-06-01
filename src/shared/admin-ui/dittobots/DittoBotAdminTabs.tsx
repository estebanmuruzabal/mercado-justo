'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  ADMIN_DITTOBOT_ASSIGNMENT_PATH,
  ADMIN_DITTOBOT_AUDIT_PATH,
  ADMIN_DITTOBOT_INVENTORY_PATH,
  ADMIN_DITTOBOT_PRODUCTS_PATH,
} from '@/shared/routing/routes'
import { cn } from '@/shared/utils/utils'

const TABS = [
  { href: ADMIN_DITTOBOT_PRODUCTS_PATH, label: 'Productos' },
  { href: ADMIN_DITTOBOT_INVENTORY_PATH, label: 'Inventario' },
  { href: ADMIN_DITTOBOT_ASSIGNMENT_PATH, label: 'Asignación' },
  { href: ADMIN_DITTOBOT_AUDIT_PATH, label: 'Auditoría' },
] as const

export function DittoBotAdminTabs() {
  const pathname = usePathname()

  return (
    <nav className='flex flex-wrap gap-2 border-b pb-3'>
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
