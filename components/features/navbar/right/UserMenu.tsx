'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  HelpCircle,
  Settings,
  User,
  type LucideIcon,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

function NavItem({
  icon: Icon,
  label,
  onSelect,
}: {
  icon: LucideIcon | null
  label: string
  onSelect: () => void
}) {
  return (
    <button
      type='button'
      onClick={onSelect}
      className='flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm hover:bg-neutral-50'
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
  const router = useRouter()
  const supabase = createClient()

  async function handleAction(action: string) {
    const actionKey = action.trim().toLowerCase()
    onClose()
    onAction?.(action)

    if (actionKey === 'logout') {
      await supabase.auth.signOut()
      router.push('/signin')
      return
    }

    if (actionKey === 'perfil' || actionKey === 'configuracion' || actionKey === 'anfitrion' || actionKey === 'invitar' || actionKey === 'coanfitrion') {
      router.push('/profile')
      return
    }

    // Fallbacks for actions not yet wired in this app:
    if (actionKey === 'favoritos' || actionKey === 'viajes' || actionKey === 'mensajes' || actionKey === 'notificaciones' || actionKey === 'idiomas' || actionKey === 'ayuda') {
      router.push('/')
      return
    }

    router.push('/')
  }

  const items: Array<
    | { id: string; label: string; icon: LucideIcon }
    | { divider: true }
  > = [
    // { id: 'favoritos', label: 'Favoritos', icon: Heart },
    // { id: 'viajes', label: 'Viajes', icon: Plane },
    // { id: 'mensajes', label: 'Mensajes', icon: MessageCircle },
    { id: 'perfil', label: 'Perfil', icon: User },
    { divider: true },
    // { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'configuracion', label: 'Configuración de la cuenta', icon: Settings },
    // { id: 'idiomas', label: 'Idiomas y moneda', icon: Globe },
    { id: 'ayuda', label: 'Centro de ayuda', icon: HelpCircle },
    { divider: true },
    { id: 'anfitrion', label: 'Convertite en vendedor', icon: User },
    { id: 'invitar', label: 'Invitá a un anfitrión', icon: User },
    { id: 'coanfitrion', label: 'Encontrá un coanfitrión', icon: User },
    { divider: true },
    { id: 'logout', label: 'Cerrar sesión', icon: User },
  ]

  return (
    <div className='w-72 overflow-hidden rounded-2xl bg-white py-2 shadow-[0_4px_20px_rgba(0,0,0,0.12)]'>
      {items.map((it, i) =>
        'divider' in it ? (
          <div key={`d-${i}`} className='my-2 border-t border-neutral-200' />
        ) : (
          <NavItem key={it.id} icon={it.icon} label={it.label} onSelect={() => void handleAction(it.id)} />
        )
      )}
      {/* Optional direct link for accessibility */}
      <div className='px-5 pb-2 text-xs text-muted-foreground'>
        <Link href='/profile'>Ir al perfil</Link>
      </div>
    </div>
  )
}

