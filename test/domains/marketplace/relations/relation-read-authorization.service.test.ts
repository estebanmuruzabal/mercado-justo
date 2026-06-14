import { describe, expect, it } from 'vitest'
import {
  canRequestPrivateReads,
  isAuthorizedReadActor,
  shouldIncludeRelationEdge,
} from '@/domains/marketplace/relations/application/auth/relation-read-authorization.service'

const storeOwner = { ownerType: 'store', ownerId: 'user-1' }

describe('canRequestPrivateReads', () => {
  it('returns false when includePrivate is true but actor is missing', () => {
    expect(canRequestPrivateReads(true, undefined)).toBe(false)
  })

  it('returns true when includePrivate and actor are both present', () => {
    expect(canRequestPrivateReads(true, { userId: 'user-1' })).toBe(true)
  })

  it('returns false when includePrivate is false', () => {
    expect(canRequestPrivateReads(false, { userId: 'user-1' })).toBe(false)
  })
})

describe('isAuthorizedReadActor', () => {
  it('returns false without actor', () => {
    expect(isAuthorizedReadActor(undefined, storeOwner)).toBe(false)
  })

  it('returns true for store owner', () => {
    expect(isAuthorizedReadActor({ userId: 'user-1' }, storeOwner)).toBe(true)
  })

  it('returns true for admin', () => {
    expect(isAuthorizedReadActor({ userId: 'other', isAdmin: true }, storeOwner)).toBe(true)
  })

  it('returns true for serviceRole', () => {
    expect(isAuthorizedReadActor({ userId: 'other', serviceRole: true }, storeOwner)).toBe(true)
  })

  it('returns false for unrelated user', () => {
    expect(isAuthorizedReadActor({ userId: 'other' }, storeOwner)).toBe(false)
  })
})

describe('shouldIncludeRelationEdge', () => {
  it('includes public edges without includePrivate', () => {
    expect(
      shouldIncludeRelationEdge({
        isPublic: true,
        includePrivate: false,
        actor: undefined,
        sourceOwner: storeOwner,
      }),
    ).toBe(true)
  })

  it('excludes non-public edges when includePrivate is true without actor', () => {
    expect(
      shouldIncludeRelationEdge({
        isPublic: false,
        includePrivate: true,
        actor: undefined,
        sourceOwner: storeOwner,
      }),
    ).toBe(false)
  })

  it('includes non-public edges for authorized source owner', () => {
    expect(
      shouldIncludeRelationEdge({
        isPublic: false,
        includePrivate: true,
        actor: { userId: 'user-1' },
        sourceOwner: storeOwner,
      }),
    ).toBe(true)
  })

  it('excludes non-public edges for unauthorized actor', () => {
    expect(
      shouldIncludeRelationEdge({
        isPublic: false,
        includePrivate: true,
        actor: { userId: 'other' },
        sourceOwner: storeOwner,
      }),
    ).toBe(false)
  })
})
