import { describe, expect, it } from 'vitest'
import { canCreateUsesRelation } from '@/domains/marketplace/relations/application/auth/relation-write-authorization.service'

const storeOwner = { ownerType: 'store', ownerId: 'user-1' }

describe('relation-write-authorization (R5.2 create-only)', () => {
  it('allows source owner', () => {
    expect(canCreateUsesRelation({ userId: 'user-1' }, storeOwner)).toBe(true)
  })

  it('allows staff via isAdmin', () => {
    expect(canCreateUsesRelation({ userId: 'stranger', isAdmin: true }, storeOwner)).toBe(true)
  })

  it('allows serviceRole', () => {
    expect(canCreateUsesRelation({ userId: 'stranger', serviceRole: true }, storeOwner)).toBe(true)
  })

  it('denies stranger', () => {
    expect(canCreateUsesRelation({ userId: 'stranger' }, storeOwner)).toBe(false)
  })

  it('denies without actor', () => {
    expect(canCreateUsesRelation(undefined, storeOwner)).toBe(false)
  })
})
