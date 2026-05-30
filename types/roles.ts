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
