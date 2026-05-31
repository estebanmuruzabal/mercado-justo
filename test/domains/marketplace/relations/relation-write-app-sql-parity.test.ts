import { describe, expect, it } from 'vitest'
import { canCreateUsesRelation } from '@/domains/marketplace/relations/application/auth/relation-write-authorization.service'

/**
 * R5.2 — Application create auth mirrors INSERT RLS (defense in depth).
 *
 * | Case              | App (canCreateUsesRelation) | SQL (R5.2 INSERT)              |
 * |-------------------|-----------------------------|--------------------------------|
 * | source owner      | allow                       | insert_uses_source_owner       |
 * | staff (isAdmin)   | allow                       | insert_uses_staff              |
 * | stranger          | deny                        | deny (default)                 |
 * | serviceRole + JWT | allow (app)                 | deny at DB (documented gap)  |
 */
describe('relation write app ↔ SQL parity (R5.2 INSERT)', () => {
  const storeOwner = { ownerType: 'store', ownerId: 'user-1' }

  it('allows store source owner (mirrors insert_uses_source_owner)', () => {
    expect(canCreateUsesRelation({ userId: 'user-1' }, storeOwner)).toBe(true)
  })

  it('denies non-owner (SQL default deny)', () => {
    expect(canCreateUsesRelation({ userId: 'stranger' }, storeOwner)).toBe(false)
  })

  it('allows admin bypass (maps to is_staff() at SQL layer)', () => {
    expect(canCreateUsesRelation({ userId: 'stranger', isAdmin: true }, storeOwner)).toBe(true)
  })
})
