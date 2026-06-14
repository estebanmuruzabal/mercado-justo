export const ROLES = {
  USER: 'user',
  SELLER: 'seller',
  SELLER_ADMIN: 'seller-admin',
  PROPERTY_ADMIN: 'property-admin',
  SUPER_ADMIN: 'super-admin',
  LOGISTICS_ADMIN: 'logistics-admin',
  MODERATOR: 'moderator',
  SUPPORT: 'support',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LIST = Object.values(ROLES) as Role[]

/**
 * Platform staff roles: the roles allowed into the Super Admin Panel.
 * `seller-admin` / `property-admin` are vendor-side roles, not platform staff.
 */
export const STAFF_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.LOGISTICS_ADMIN,
  ROLES.MODERATOR,
  ROLES.SUPPORT,
] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

export function isRole(value: string): value is Role {
  return ROLE_LIST.includes(value as Role)
}

export function isStaffRole(value: Role | null | undefined): value is StaffRole {
  return value ? (STAFF_ROLES as readonly Role[]).includes(value) : false
}

export function hasRole(userRole: Role | null | undefined, allowedRole: Role) {
  return userRole === allowedRole
}

export function hasAnyRole(
  userRole: Role | null | undefined,
  allowedRoles: readonly Role[],
) {
  return userRole ? allowedRoles.includes(userRole) : false
}

export function isAdminRole(role: Role | null | undefined) {
  return hasAnyRole(role, [ROLES.SELLER_ADMIN, ROLES.PROPERTY_ADMIN, ROLES.SUPER_ADMIN])
}

export function isSuperAdmin(role: Role | null | undefined) {
  return role === ROLES.SUPER_ADMIN
}

/** True when the role is allowed into the Super Admin Panel. */
export function isStaff(role: Role | null | undefined) {
  return isStaffRole(role)
}
