import { describe, expect, it } from 'vitest'
import {
  isAuthorizedReadActor,
  shouldIncludeRelationEdge,
} from '@/domains/marketplace/relations/application/auth/relation-read-authorization.service'

/**
 * R3.4 — Application auth mirrors SQL policy (defense in depth).
 *
 * | Case                         | App (shouldIncludeRelationEdge) | SQL (R3.4)                    |
 * |------------------------------|---------------------------------|-------------------------------|
 * | public edge                  | allow                           | allow (select_public)         |
 * | private + source owner       | allow w/ includePrivate+actor   | allow (select_private_owner)  |
 * | private + non-owner          | deny                            | deny                          |
 * | includePrivate without actor | deny                            | deny (app); SQL no private    |
 * | admin (isAdmin)              | allow                           | allow via is_staff() policy   |
 * | serviceRole + user client    | allow (app)                     | deny at DB (documented gap)   |
 */
describe('relation app ↔ SQL parity (R3.4)', () => {
  const storeOwner = { ownerType: 'store', ownerId: 'user-1' }
  const userOwner = { ownerType: 'user', ownerId: 'user-2' }
  const orgOwner = { ownerType: 'org', ownerId: 'org-1' }

  describe('isAuthorizedReadActor — owner predicate mirrors select_private_source_owner', () => {
    it('allows store source owner', () => {
      expect(isAuthorizedReadActor({ userId: 'user-1' }, storeOwner)).toBe(true)
    })

    it('allows user source owner', () => {
      expect(isAuthorizedReadActor({ userId: 'user-2' }, userOwner)).toBe(true)
    })

    it('denies org source owner (no org in SQL policy)', () => {
      expect(isAuthorizedReadActor({ userId: 'org-1' }, orgOwner)).toBe(false)
    })

    it('denies non-owner', () => {
      expect(isAuthorizedReadActor({ userId: 'stranger' }, storeOwner)).toBe(false)
    })

    it('allows admin bypass (maps to is_staff() at SQL layer)', () => {
      expect(isAuthorizedReadActor({ userId: 'stranger', isAdmin: true }, storeOwner)).toBe(true)
    })
  })

  describe('shouldIncludeRelationEdge — full read path', () => {
    it('allows public edges without includePrivate', () => {
      expect(
        shouldIncludeRelationEdge({
          isPublic: true,
          includePrivate: false,
          actor: undefined,
          sourceOwner: storeOwner,
        }),
      ).toBe(true)
    })

    it('denies non-public edges when includePrivate without actor', () => {
      expect(
        shouldIncludeRelationEdge({
          isPublic: false,
          includePrivate: true,
          actor: undefined,
          sourceOwner: storeOwner,
        }),
      ).toBe(false)
    })

    it('allows non-public edges for authorized source owner', () => {
      expect(
        shouldIncludeRelationEdge({
          isPublic: false,
          includePrivate: true,
          actor: { userId: 'user-1' },
          sourceOwner: storeOwner,
        }),
      ).toBe(true)
    })

    it('denies non-public edges for non-owner', () => {
      expect(
        shouldIncludeRelationEdge({
          isPublic: false,
          includePrivate: true,
          actor: { userId: 'stranger' },
          sourceOwner: storeOwner,
        }),
      ).toBe(false)
    })
  })
})
