import {
  ROLES,
  ROLE_LIST,
  STAFF_ROLES,
  type Role,
  type StaffRole,
  isRole,
  isStaffRole,
} from '@/types/roles'

export { ROLES, ROLE_LIST, STAFF_ROLES, isRole, isStaffRole }
export type { Role, StaffRole }


export function hasRole(userRole: Role | null | undefined, allowedRole: Role) {
  return userRole === allowedRole
}

export function hasAnyRole(
  userRole: Role | null | undefined,
  allowedRoles: readonly Role[]
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

// Basic usage:
// if (!hasAnyRole(userRole, [ROLES.SELLER, ROLES.SELLER_ADMIN])) return redirect('/forbidden')
// if (!isSuperAdmin(userRole)) throw new Error('Forbidden')