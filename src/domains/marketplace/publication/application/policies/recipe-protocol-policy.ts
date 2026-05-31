import type { OwnerRef } from '@/domains/marketplace/publication/domain/value-objects/owner-ref'
import {
  canTransition,
  type LifecycleState,
} from '@/domains/marketplace/shared/domain/lifecycle-state'
import type { Visibility } from '@/domains/marketplace/shared/domain/visibility'
import { isSuperAdmin, type Role } from '@/domains/users/domain/roles'

export const RECIPE_PROTOCOL_PUBLICATION_TYPE = 'recipe' as const

/**
 * Marketplace Seller ≠ Ditto Grower.
 * `isGrowerMember` must come from DittoBot ownership (dittobots BC), never store/seller roles.
 */
export type ProtocolPolicyActor = {
  userId: string
  role: Role | null
  /** Pre-resolved via `isGrowerMember(userId)` — not derived from seller/store. */
  isGrowerMember: boolean
}

export type ProtocolPublicationView = {
  publicationType: string
  owner: OwnerRef
  lifecycle: LifecycleState
  moderationStatus: string
  visibility: Visibility
}

export function isRecipeProtocolPublication(publicationType: string): boolean {
  return publicationType === RECIPE_PROTOCOL_PUBLICATION_TYPE
}

/** Protocol publications must be authored by a user — never store/seller owner. */
export function isValidRecipeProtocolOwner(owner: OwnerRef): boolean {
  return owner.ownerType === 'user'
}

export function isProtocolAuthor(actor: ProtocolPolicyActor, owner: OwnerRef): boolean {
  return owner.ownerType === 'user' && owner.ownerId === actor.userId
}

export function isCommunityLibraryProtocol(pub: ProtocolPublicationView): boolean {
  if (!isRecipeProtocolPublication(pub.publicationType)) return false
  return (
    pub.lifecycle === 'published' &&
    pub.moderationStatus === 'approved' &&
    pub.visibility === 'public'
  )
}

export function isPrivateToAuthor(pub: ProtocolPublicationView): boolean {
  return isRecipeProtocolPublication(pub.publicationType) && !isCommunityLibraryProtocol(pub)
}

export function canViewProtocol(actor: ProtocolPolicyActor, pub: ProtocolPublicationView): boolean {
  if (!isRecipeProtocolPublication(pub.publicationType)) return false
  if (!isValidRecipeProtocolOwner(pub.owner)) return false

  if (isSuperAdmin(actor.role)) return true

  if (isCommunityLibraryProtocol(pub)) {
    return actor.isGrowerMember
  }

  return isProtocolAuthor(actor, pub.owner)
}

function canAuthorProtocol(actor: ProtocolPolicyActor): boolean {
  return actor.isGrowerMember || isSuperAdmin(actor.role)
}

export function canCreateProtocol(actor: ProtocolPolicyActor): boolean {
  return canAuthorProtocol(actor)
}

export function canEditProtocol(
  actor: ProtocolPolicyActor,
  pub: ProtocolPublicationView,
): boolean {
  if (!isRecipeProtocolPublication(pub.publicationType)) return false
  if (!isValidRecipeProtocolOwner(pub.owner)) return false
  if (!canAuthorProtocol(actor)) return false

  if (isSuperAdmin(actor.role)) return true

  if (!isProtocolAuthor(actor, pub.owner)) return false

  return pub.lifecycle === 'draft' || pub.lifecycle === 'pending_review'
}

export function canSubmitProtocolForReview(
  actor: ProtocolPolicyActor,
  pub: ProtocolPublicationView,
): boolean {
  if (!canEditProtocol(actor, pub)) return false
  return pub.lifecycle === 'draft'
}

export function canApproveProtocol(actor: ProtocolPolicyActor): boolean {
  return isSuperAdmin(actor.role)
}

export function canRejectProtocol(actor: ProtocolPolicyActor): boolean {
  return isSuperAdmin(actor.role)
}

export function canArchiveProtocol(
  actor: ProtocolPolicyActor,
  pub: ProtocolPublicationView,
): boolean {
  if (!isRecipeProtocolPublication(pub.publicationType)) return false
  if (!isSuperAdmin(actor.role)) return false
  return pub.lifecycle === 'published'
}

export function canTransitionProtocolLifecycle(
  from: LifecycleState,
  to: LifecycleState,
  actor: ProtocolPolicyActor,
  pub: ProtocolPublicationView,
): boolean {
  if (!isRecipeProtocolPublication(pub.publicationType)) return false
  if (!canTransition(from, to)) return false

  if (from === 'draft' && to === 'pending_review') {
    return canSubmitProtocolForReview(actor, pub)
  }

  if (from === 'pending_review' && to === 'published') {
    return canApproveProtocol(actor)
  }

  if (from === 'pending_review' && to === 'draft') {
    return canRejectProtocol(actor)
  }

  if (from === 'published' && to === 'archived') {
    return canArchiveProtocol(actor, pub)
  }

  if (isSuperAdmin(actor.role)) {
    return true
  }

  return false
}
