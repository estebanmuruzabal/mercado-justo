import {
  BarChart3,
  Bell,
  LayoutDashboard,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Users,
} from 'lucide-react'

import {
  ADMIN_ANALYTICS_PATH,
  ADMIN_CATEGORIES_PATH,
  ADMIN_DASHBOARD_PATH,
  ADMIN_LISTINGS_PATH,
  ADMIN_LOGISTICS_PATH,
  ADMIN_MODERATION_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_ORDERS_PATH,
  ADMIN_USERS_PATH,
  ADMIN_VENDORS_PATH,
} from '@/shared/routing/routes'
import { PERMISSIONS, type Permission } from '@/shared/auth/permissions'

export type AdminNavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  permission: Permission
}

/**
 * Single source of truth for admin navigation. Each item declares the
 * capability required to see it; the sidebar filters by the viewer's
 * permissions (no hardcoded role checks in the UI).
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: ADMIN_DASHBOARD_PATH, label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: ADMIN_USERS_PATH, label: 'Usuarios', icon: Users, permission: PERMISSIONS.USERS_VIEW },
  { href: ADMIN_VENDORS_PATH, label: 'Vendedores', icon: Store, permission: PERMISSIONS.VENDORS_VIEW },
  { href: ADMIN_CATEGORIES_PATH, label: 'Categorías', icon: Tags, permission: PERMISSIONS.CATEGORIES_MANAGE },
  { href: ADMIN_LISTINGS_PATH, label: 'Productos', icon: Package, permission: PERMISSIONS.LISTINGS_VIEW },
  { href: ADMIN_ORDERS_PATH, label: 'Órdenes', icon: ShoppingBag, permission: PERMISSIONS.ORDERS_VIEW },
  { href: ADMIN_LOGISTICS_PATH, label: 'Logística', icon: Truck, permission: PERMISSIONS.LOGISTICS_MANAGE },
  { href: ADMIN_MODERATION_PATH, label: 'Moderación', icon: ShieldCheck, permission: PERMISSIONS.REPORTS_VIEW },
  { href: ADMIN_NOTIFICATIONS_PATH, label: 'Notificaciones', icon: Bell, permission: PERMISSIONS.NOTIFICATIONS_VIEW },
  { href: ADMIN_ANALYTICS_PATH, label: 'Analytics', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
]

export function visibleNavItems(permissions: readonly Permission[]): AdminNavItem[] {
  const set = new Set(permissions)
  return ADMIN_NAV_ITEMS.filter((item) => set.has(item.permission))
}
