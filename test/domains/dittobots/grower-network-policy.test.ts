import { describe, expect, it } from 'vitest'
import {
  canContactGrower,
  canSuspendGrowerAccess,
  canViewGrowerNetwork,
} from '@/domains/dittobots/domain/grower-network-policy'
import { ROLES } from '@/domains/users/domain/roles'

describe('grower-network-policy', () => {
  const superAdmin = { userId: 'admin-1', role: ROLES.SUPER_ADMIN }
  const moderator = { userId: 'mod-1', role: ROLES.MODERATOR }
  const seller = { userId: 'seller-1', role: ROLES.SELLER }

  it('allows network operations for super-admin only', () => {
    expect(canViewGrowerNetwork(superAdmin)).toBe(true)
    expect(canContactGrower(superAdmin)).toBe(true)
    expect(canSuspendGrowerAccess(superAdmin, 'grower-9')).toBe(true)
  })

  it('denies platform staff and sellers', () => {
    expect(canViewGrowerNetwork(moderator)).toBe(false)
    expect(canContactGrower(moderator)).toBe(false)
    expect(canSuspendGrowerAccess(moderator, 'grower-9')).toBe(false)

    expect(canViewGrowerNetwork(seller)).toBe(false)
    expect(canContactGrower(seller)).toBe(false)
  })
})
