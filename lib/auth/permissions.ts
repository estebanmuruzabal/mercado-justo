import { ROLES, type Role } from '@/lib/roles'

/**
 * Scalable RBAC permission matrix.
 *
 * Permissions are granular capabilities ("verbs on a domain"), decoupled from
 * roles so the platform can add staff dashboards / internal tooling without
 * hardcoding role checks across the codebase. UI and server actions ask
 * `can(role, permission)` rather than comparing roles directly.
 */
export const PERMISSIONS = {
  // Cross-cutting access to the admin panel.
  ADMIN_ACCESS: 'admin:access',

  // Platform users (super-admin only).
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',

  // Vendors (super-admin only).
  VENDORS_VIEW: 'vendors:view',
  VENDORS_APPROVE: 'vendors:approve',
  VENDORS_SUSPEND: 'vendors:suspend',
  VENDORS_FEATURE: 'vendors:feature',
  VENDORS_EDIT: 'vendors:edit',

  // Listings / products moderation.
  LISTINGS_VIEW: 'listings:view',
  LISTINGS_MODERATE: 'listings:moderate',

  // Orders & shipments / logistics.
  ORDERS_VIEW: 'orders:view',
  SHIPMENTS_OVERRIDE: 'shipments:override',
  LOGISTICS_MANAGE: 'logistics:manage',

  // Moderation queue (reports).
  REPORTS_VIEW: 'reports:view',
  REPORTS_RESOLVE: 'reports:resolve',

  // Notifications / ops alerts.
  NOTIFICATIONS_VIEW: 'notifications:view',

  // Analytics.
  ANALYTICS_VIEW: 'analytics:view',

  // Category taxonomy (super-admin only).
  CATEGORIES_MANAGE: 'categories:manage',

  // Audit log.
  AUDIT_VIEW: 'audit:view',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

const P = PERMISSIONS

/** Every permission a super-admin holds (i.e. all of them). */
const ALL_PERMISSIONS = Object.values(P) as Permission[]

/**
 * Role -> permissions. Only platform staff roles appear here; non-staff roles
 * (user, seller, ...) get no admin permissions.
 */
const ROLE_PERMISSIONS: Partial<Record<Role, readonly Permission[]>> = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,

  [ROLES.LOGISTICS_ADMIN]: [
    P.ADMIN_ACCESS,
    P.ORDERS_VIEW,
    P.SHIPMENTS_OVERRIDE,
    P.LOGISTICS_MANAGE,
    P.NOTIFICATIONS_VIEW,
    P.ANALYTICS_VIEW,
  ],

  [ROLES.MODERATOR]: [
    P.ADMIN_ACCESS,
    P.LISTINGS_VIEW,
    P.LISTINGS_MODERATE,
    P.REPORTS_VIEW,
    P.REPORTS_RESOLVE,
    P.NOTIFICATIONS_VIEW,
  ],

  [ROLES.SUPPORT]: [
    P.ADMIN_ACCESS,
    P.ORDERS_VIEW,
    P.LISTINGS_VIEW,
    P.REPORTS_VIEW,
    P.NOTIFICATIONS_VIEW,
  ],
}

/** Does this role hold the given permission? */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false
  const granted = ROLE_PERMISSIONS[role]
  return granted ? granted.includes(permission) : false
}

/** All permissions held by a role (useful for filtering nav by capability). */
export function permissionsForRole(role: Role | null | undefined): readonly Permission[] {
  if (!role) return []
  return ROLE_PERMISSIONS[role] ?? []
}

/** True when the role may enter the admin panel at all. */
export function canAccessAdmin(role: Role | null | undefined): boolean {
  return can(role, P.ADMIN_ACCESS)
}

/** True when the role is super-admin (full platform control). */
export function canManageUsers(role: Role | null | undefined): boolean {
  return can(role, P.USERS_MANAGE)
}

export function canManageVendors(role: Role | null | undefined): boolean {
  return can(role, P.VENDORS_VIEW)
}
