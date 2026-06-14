'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, ShieldCheck } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { ADMIN_DASHBOARD_PATH } from '@/shared/routing/routes'
import { type Permission } from '@/shared/auth/permissions'
import { visibleNavItems } from '@/shared/admin-ui/admin-nav-items'
import { cn } from '@/shared/utils/utils'

export function AdminMobileNav({ permissions }: { permissions: Permission[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const items = visibleNavItems(permissions)

  function isActive(href: string) {
    if (href === ADMIN_DASHBOARD_PATH) return pathname === ADMIN_DASHBOARD_PATH
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline' size='icon' className='md:hidden' aria-label='Abrir menú'>
          <Menu className='h-4 w-4' />
        </Button>
      </SheetTrigger>
      <SheetContent side='left' className='w-[280px] p-0'>
        <SheetHeader className='border-b p-4'>
          <SheetTitle className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
              <ShieldCheck className='h-4 w-4' />
            </div>
            Admin Panel
          </SheetTitle>
        </SheetHeader>
        <nav className='flex flex-col gap-1 p-3'>
          {items.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className='h-4 w-4' />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
