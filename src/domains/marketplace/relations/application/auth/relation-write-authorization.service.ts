import {
  isAuthorizedReadActor,
  type RelationOwnerContext,
  type RelationReadActor,
} from './relation-read-authorization.service'

/** R5.2 create-only — same actor shape as read authorization. */
export type RelationWriteActor = RelationReadActor

/**
 * Source publication owner or staff may create uses edges.
 * Target owner consent deferred (cross-vendor link-only MVP).
 */
export function canCreateUsesRelation(
  actor: RelationWriteActor | undefined,
  sourceOwner: RelationOwnerContext,
): boolean {
  return isAuthorizedReadActor(actor, sourceOwner)
}
