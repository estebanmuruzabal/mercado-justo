'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  HelpCircle,
  Settings,
  User,
  Package,
  ShoppingBag,
  Store,
  Tags,
  type LucideIcon,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { signOutClient } from '@/lib/auth/sign-out-client'
import { signOut } from '@/server/actions/auth'

function NavItem({
  icon: Icon,
  label,
  active,
  onSelect,
}: {
  icon: LucideIcon | null
  label: string
  active?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm transition-colors',
        active ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-700 hover:bg-neutral-50',
      )}
    >
      {Icon ? <Icon className='h-4 w-4 text-neutral-700' /> : null}
      <span>{label}</span>
    </button>
  )
}

export function UserMenu({
  onAction,
  onClose,
}: {
  onAction?: (action: string) => void
  onClose: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [checkingSeller, setCheckingSeller] = useState(true)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (!cancelled) setIsAuthenticated(false)
          if (!cancelled) setIsSeller(false)
          if (!cancelled) setCheckingSeller(false)
          return
        }

        if (!cancelled) setIsAuthenticated(true)
        const { data: storeRow } = await supabase
          .from('store')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!cancelled) setIsSeller(Boolean(storeRow))
      } catch {
        if (!cancelled) setIsAuthenticated(false)
        if (!cancelled) setIsSeller(false)
      } finally {
        if (!cancelled) setCheckingAuth(false)
        if (!cancelled) setCheckingSeller(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => {
    router.prefetch('/profile')
  }, [router])

  async function handleAction(action: string) {
    const actionKey = action.trim().toLowerCase()
    onClose()
    onAction?.(action)

    if (actionKey === 'logout') {
      await signOutClient()
      await signOut()
      return
    }

    if (actionKey === 'signin') {
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    if (actionKey === 'signup') {
      router.push(`/signup?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    if (actionKey === 'perfil' || actionKey === 'configuracion' || actionKey === 'invitar' || actionKey === 'coanfitrion') {
      router.push('/profile')
      return
    }

    if (actionKey === 'anfitrion') {
      router.push('/dashboard-vendor/seller')
      return
    }

    if (actionKey === 'vendor_listings') {
      router.push('/dashboard-vendor/listings')
      return
    }

    if (actionKey === 'vendor_sales') {
      router.push('/dashboard-vendor/ventas')
      return
    }

    if (actionKey === 'vendor_categories') {
      router.push('/dashboard-vendor/categorias')
      return
    }

    if (actionKey === 'vendor_seller') {
      router.push('/dashboard-vendor/seller')
      return
    }

    // Fallbacks for actions not yet wired in this app:
    if (actionKey === 'favoritos' || actionKey === 'viajes' || actionKey === 'mensajes' || actionKey === 'notificaciones' || actionKey === 'idiomas' || actionKey === 'ayuda') {
      router.push('/')
      return
    }

    router.push('/')
  }

  function isActiveItem(itemId: string) {
    if (itemId === 'signin' || itemId === 'signup') return false
    if (itemId === 'perfil' || itemId === 'configuracion') return pathname === '/profile'
    if (itemId === 'anfitrion') return pathname === '/dashboard-vendor/seller'

    if (itemId === 'vendor_listings') return pathname.startsWith('/dashboard-vendor/listings')
    if (itemId === 'vendor_sales') return pathname.startsWith('/dashboard-vendor/ventas')
    if (itemId === 'vendor_categories') return pathname.startsWith('/dashboard-vendor/categorias')
    if (itemId === 'vendor_seller') return pathname.startsWith('/dashboard-vendor/seller')

    if (itemId === 'ayuda') return pathname === '/'

    if (itemId === 'logout') return false
    if (itemId === 'invitar' || itemId === 'coanfitrion') return pathname === '/profile'
    return false
  }

  const guestItems: Array<{ id: string; label: string; icon: LucideIcon } | { divider: true }> = [
    { id: 'signin', label: 'Ingresar a tu cuenta', icon: User },
    { id: 'signup', label: 'Crear cuenta', icon: User },
    { divider: true },
    { id: 'ayuda', label: 'Centro de ayuda', icon: HelpCircle },
  ]

  const authenticatedItems: Array<{ id: string; label: string; icon: LucideIcon } | { divider: true }> = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { divider: true },
    { id: 'configuracion', label: 'Configuración de la cuenta', icon: Settings },
    { id: 'ayuda', label: 'Centro de ayuda', icon: HelpCircle },
  ]

  const sellerItems: Array<{ id: string; label: string; icon: LucideIcon } | { divider: true }> = isSeller
    ? [
        { divider: true },
        { id: 'vendor_listings', label: 'Mis Listings', icon: Package },
        { id: 'vendor_sales', label: 'Ventas', icon: ShoppingBag },
        { id: 'vendor_categories', label: 'Categorías', icon: Tags },
        { id: 'vendor_seller', label: 'Modo vendedor', icon: Store },
      ]
    : [
        { divider: true },
        { id: 'anfitrion', label: 'Convertite en vendedor', icon: User },
      ]

  const items: Array<{ id: string; label: string; icon: LucideIcon } | { divider: true }> = checkingAuth
    ? []
    : isAuthenticated
      ? [...authenticatedItems, ...(!checkingSeller ? sellerItems : []), { divider: true }, { id: 'logout', label: 'Cerrar sesión', icon: User }]
      : guestItems

  return (
    <div className='w-72 overflow-hidden rounded-2xl bg-white py-2 shadow-[0_4px_20px_rgba(0,0,0,0.12)]'>
      {items.map((it, i) =>
        'divider' in it ? (
          <div key={`d-${i}`} className='my-2 border-t border-neutral-200' />
        ) : (
          <NavItem
            key={it.id}
            icon={it.icon}
            label={it.label}
            active={isActiveItem(it.id)}
            onSelect={() => void handleAction(it.id)}
          />
        )
      )}
      {/* Optional direct link for accessibility */}
      {isAuthenticated ? (
        <div className='px-5 pb-2 text-xs text-muted-foreground'>
          <Link href='/profile' prefetch>
            Ir al perfil
          </Link>
        </div>
      ) : null}
    </div>
  )
}

