'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Bot,
  Layers3,
  Package,
  Shield,
  Store as StoreIcon,
  User,
  type LucideIcon,
} from 'lucide-react'

import { CategoriesTab } from '@/components/profile/tabs/categories'
import { ProfileContent } from '@/components/profile/profile-content'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { isSuperAdmin, type Role } from '@/lib/roles'
import type { Store as StoreModel } from '@/types/store'

type TabId = 'personal' | 'security' | 'seller' | 'products' | 'categories' | 'ditto'

const TAB_ICONS: Record<TabId, LucideIcon> = {
  personal: User,
  security: Shield,
  seller: StoreIcon,
  products: Package,
  categories: Layers3,
  ditto: Bot,
}

function TabNavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors lg:w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
        active
          ? 'bg-accent text-accent-foreground shadow-xs'
          : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      )}
    >
      <Icon className='size-4 shrink-0 opacity-80' aria-hidden />
      {label}
    </button>
  )
}

export function ProfilePageClient({
  userEmail,
  initialStore,
  initialRole,
}: {
  userEmail: string
  initialStore: StoreModel | null
  initialRole: Role | null
}) {
  const [tab, setTab] = useState<TabId>('personal')
  const [store, setStore] = useState<StoreModel | null>(initialStore)
  const isSeller = Boolean(store)
  const isAdmin = isSuperAdmin(initialRole)

  const tabs = useMemo(() => {
    const base: Array<{ id: TabId; label: string }> = [
      { id: 'personal', label: 'Datos personales' },
      { id: 'security', label: 'Seguridad' },
      { id: 'seller', label: 'Modo vendedor' },
      ...(isSeller ? [{ id: 'products' as const, label: 'Productos' }] : []),
      ...(isAdmin ? [{ id: 'categories' as const, label: 'Categorías' }] : []),
      { id: 'ditto', label: 'DittoBots' },
    ]

    return base
  }, [isAdmin, isSeller])

  useEffect(() => {
    if (tab === 'products' && !isSeller) {
      setTab('seller')
    }
  }, [isSeller, tab])

  useEffect(() => {
    if (tab === 'categories' && !isAdmin) {
      setTab(isSeller ? 'seller' : 'personal')
    }
  }, [isAdmin, isSeller, tab])

  const initial = userEmail?.trim()?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto max-w-6xl px-4 py-6 md:py-10'>
        <div className='mb-6'>
          <Button variant='ghost' size='sm' className='-ml-2 gap-2 text-muted-foreground' asChild>
            <Link href='/'>
              <ArrowLeft className='size-4' />
              Volver al panel
            </Link>
          </Button>
        </div>

        <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10'>
          <aside className='lg:w-64 lg:shrink-0'>
            <div className='flex gap-2 overflow-x-auto pb-2 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
              {tabs.map((t) => (
                <TabNavButton
                  key={t.id}
                  active={tab === t.id}
                  icon={TAB_ICONS[t.id]}
                  label={t.label}
                  onClick={() => setTab(t.id)}
                />
              ))}
            </div>

            <Card className='hidden shadow-sm lg:block lg:sticky lg:top-6 lg:py-0'>
              <CardHeader className='gap-3 pb-4 pt-5'>
                <div className='flex items-center gap-3'>
                  <div
                    className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground'
                    aria-hidden
                  >
                    {initial}
                  </div>
                  <div className='min-w-0'>
                    <CardTitle className='text-base'>Tu perfil</CardTitle>
                    <CardDescription className='truncate' title={userEmail || undefined}>
                      {userEmail || 'Sin email en la sesión'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className='flex flex-col gap-1 px-2 py-3'>
                <p className='px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Secciones
                </p>
                <nav className='flex flex-col gap-0.5' aria-label='Perfil'>
                  {tabs.map((t) => (
                    <TabNavButton
                      key={t.id}
                      active={tab === t.id}
                      icon={TAB_ICONS[t.id]}
                      label={t.label}
                      onClick={() => setTab(t.id)}
                    />
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          <main className='min-w-0 flex-1'>
            <Card className='shadow-sm'>
              <CardContent className='pt-6 pb-6'>
                {tab === 'categories' ? (
                  <CategoriesTab />
                ) : (
                  <ProfileContent
                    tab={tab}
                    user={{ email: userEmail }}
                    store={store}
                    onStoreCreated={setStore}
                  />
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
