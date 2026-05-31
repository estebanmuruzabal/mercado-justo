import { describe, expect, it } from 'vitest'
import {
  canApproveProtocol,
  canArchiveProtocol,
  canCreateProtocol,
  canEditProtocol,
  canRejectProtocol,
  canSubmitProtocolForReview,
  canTransitionProtocolLifecycle,
  canViewProtocol,
  isCommunityLibraryProtocol,
  isPrivateToAuthor,
  isValidRecipeProtocolOwner,
  type ProtocolPolicyActor,
  type ProtocolPublicationView,
} from '@/domains/marketplace/publication/application/policies/recipe-protocol-policy'
import { userOwner, storeOwner } from '@/domains/marketplace/publication/domain/value-objects/owner-ref'
import { ROLES } from '@/domains/users/domain/roles'

const authorId = 'author-1'

function actor(overrides: Partial<ProtocolPolicyActor> = {}): ProtocolPolicyActor {
  return {
    userId: authorId,
    role: ROLES.USER,
    isGrowerMember: true,
    ...overrides,
  }
}

function pub(overrides: Partial<ProtocolPublicationView> = {}): ProtocolPublicationView {
  return {
    publicationType: 'recipe',
    owner: userOwner(authorId),
    lifecycle: 'draft',
    moderationStatus: 'pending',
    visibility: 'private',
    ...overrides,
  }
}

describe('recipe-protocol-policy', () => {
  it('requires user owner for protocol publications', () => {
    expect(isValidRecipeProtocolOwner(userOwner('u'))).toBe(true)
    expect(isValidRecipeProtocolOwner(storeOwner('store-1'))).toBe(false)
  })

  it('classifies community library vs private', () => {
    const library = pub({
      lifecycle: 'published',
      moderationStatus: 'approved',
      visibility: 'public',
    })
    expect(isCommunityLibraryProtocol(library)).toBe(true)
    expect(isPrivateToAuthor(library)).toBe(false)

    const draft = pub({ lifecycle: 'draft', visibility: 'private' })
    expect(isCommunityLibraryProtocol(draft)).toBe(false)
    expect(isPrivateToAuthor(draft)).toBe(true)
  })

  it('allows grower members to view approved community protocols', () => {
    const library = pub({
      lifecycle: 'published',
      moderationStatus: 'approved',
      visibility: 'public',
    })
    expect(
      canViewProtocol(actor({ userId: 'other-grower', isGrowerMember: true }), library),
    ).toBe(true)
    expect(
      canViewProtocol(actor({ userId: 'stranger', isGrowerMember: false, role: ROLES.USER }), library),
    ).toBe(false)
  })

  it('restricts private protocols to author and super-admin', () => {
    const draft = pub({ lifecycle: 'draft', visibility: 'private' })
    expect(canViewProtocol(actor(), draft)).toBe(true)
    expect(
      canViewProtocol(actor({ userId: 'other', isGrowerMember: true }), draft),
    ).toBe(false)
    expect(
      canViewProtocol(actor({ userId: 'admin', role: ROLES.SUPER_ADMIN, isGrowerMember: false }), draft),
    ).toBe(true)
  })

  it('gates create/edit on grower membership or super-admin', () => {
    expect(canCreateProtocol(actor())).toBe(true)
    expect(canCreateProtocol(actor({ isGrowerMember: false }))).toBe(false)
    expect(
      canCreateProtocol(actor({ isGrowerMember: false, role: ROLES.SUPER_ADMIN })),
    ).toBe(true)

    expect(canEditProtocol(actor(), pub())).toBe(true)
    expect(canEditProtocol(actor({ isGrowerMember: false }), pub())).toBe(false)
    expect(
      canEditProtocol(actor({ userId: 'other', isGrowerMember: true }), pub()),
    ).toBe(false)
  })

  it('allows only super-admin to approve, reject, and archive', () => {
    expect(canApproveProtocol(actor())).toBe(false)
    expect(canRejectProtocol(actor())).toBe(false)
    expect(
      canArchiveProtocol(actor({ role: ROLES.SUPER_ADMIN, isGrowerMember: false }), pub({
        lifecycle: 'published',
        moderationStatus: 'approved',
        visibility: 'public',
      })),
    ).toBe(true)
    expect(canApproveProtocol(actor({ role: ROLES.SUPER_ADMIN }))).toBe(true)
    expect(canRejectProtocol(actor({ role: ROLES.MODERATOR }))).toBe(false)
  })

  it('allows author grower to submit draft for review', () => {
    expect(canSubmitProtocolForReview(actor(), pub())).toBe(true)
    expect(
      canSubmitProtocolForReview(actor(), pub({ lifecycle: 'pending_review' })),
    ).toBe(false)
  })

  it('enforces lifecycle transitions by role', () => {
    const draft = pub()
    expect(
      canTransitionProtocolLifecycle('draft', 'pending_review', actor(), draft),
    ).toBe(true)
    expect(
      canTransitionProtocolLifecycle('pending_review', 'published', actor(), draft),
    ).toBe(false)
    expect(
      canTransitionProtocolLifecycle(
        'pending_review',
        'published',
        actor({ role: ROLES.SUPER_ADMIN, isGrowerMember: false }),
        pub({ lifecycle: 'pending_review' }),
      ),
    ).toBe(true)
  })
})
