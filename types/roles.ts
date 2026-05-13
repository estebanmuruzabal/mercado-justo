export const ROLES = {
  USER: 'user',
  SELLER: 'seller',
  SELLER_ADMIN: 'seller-admin',
  PROPERTY_ADMIN: 'property-admin',
  SUPER_ADMIN: 'super-admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LIST = Object.values(ROLES) as Role[]

export function isRole(value: string): value is Role {
  return ROLE_LIST.includes(value as Role)
}
