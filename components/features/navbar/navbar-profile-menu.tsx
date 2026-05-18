'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signOut } from '@/server/actions/auth'

type MenuItem = { id: string; label: string; href?: string; onClick?: () => void }

export function NavbarProfileMenu({ email }: { email?: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const displayEmail = email?.trim() ? email.trim() : 'Account'
  const initials = useMemo(() => {
    const first = displayEmail.charAt(0).toUpperCase()
    return first || '?'
  }, [displayEmail])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = rootRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  const items: MenuItem[] = [
    { id: 'profile', label: 'Profile', href: '/profile' },
  ]

  return (
    <div ref={rootRef} className='relative'>
      <Button
        type='button'
        variant='ghost'
        className='h-10 rounded-full px-3'
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label='Open profile menu'
      >
        <div className='flex items-center gap-2'>
          <span className='inline-flex size-7 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground'>
            {initials}
          </span>
          <User className='hidden size-5 sm:block' />
          <span className='hidden text-sm font-medium sm:inline'>{displayEmail}</span>
        </div>
      </Button>

      {open ? (
        <div
          className={cn(
            'absolute right-0 mt-2 w-64 rounded-2xl border bg-background shadow-lg',
            'animate-in fade-in-0 zoom-in-95'
          )}
          role='menu'
        >
          <div className='px-4 py-3'>
            <div className='text-sm font-semibold'>{displayEmail}</div>
            <div className='text-xs text-muted-foreground'>Welcome back</div>
          </div>

          <div className='px-2 pb-2'>
            {items.map((item) => {
              const isDisabled = !item.href
              const commonProps = {
                className:
                  'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ' +
                  (isDisabled ? 'cursor-not-allowed text-muted-foreground' : 'hover:bg-muted/60'),
              }

              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    {...commonProps}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              }

              return (
                <button
                  key={item.id}
                  type='button'
                  {...commonProps}
                  onClick={(e) => {
                    e.preventDefault()
                    item.onClick?.()
                  }}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className='px-2 pb-3'>
            <div className='px-3 pb-2 text-xs font-medium text-muted-foreground'>Actions</div>
            <form
              action={signOut}
              onSubmit={() => setOpen(false)}
              className='px-2'
            >
              <button
                type='submit'
                className='flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10'
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

