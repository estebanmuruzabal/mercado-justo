import {
  isStoreOwner,
  isUserOwner,
  ownerRefFromPublicationRow,
} from '@/domains/marketplace/shared/application/ownership-policy'

export type RelationReadActor = {
  userId: string
  isAdmin?: boolean
  serviceRole?: boolean
}

export type RelationOwnerContext = {
  ownerType: string
  ownerId: string
}

export function canRequestPrivateReads(
  includePrivate: boolean | undefined,
  actor: RelationReadActor | undefined,
): boolean {
  return includePrivate === true && actor !== undefined
}

export function isAuthorizedReadActor(
  actor: RelationReadActor | undefined,
  sourceOwner: RelationOwnerContext,
): boolean {
  if (!actor) {
    return false
  }

  if (actor.isAdmin || actor.serviceRole) {
    return true
  }

  const owner = ownerRefFromPublicationRow({
    owner_type: sourceOwner.ownerType,
    owner_id: sourceOwner.ownerId,
  })

  const ownershipActor = { userId: actor.userId }
  return isStoreOwner(ownershipActor, owner) || isUserOwner(ownershipActor, owner)
}

export function shouldIncludeRelationEdge(params: {
  isPublic: boolean
  includePrivate: boolean | undefined
  actor: RelationReadActor | undefined
  sourceOwner: RelationOwnerContext
}): boolean {
  if (params.isPublic) {
    return true
  }

  if (!canRequestPrivateReads(params.includePrivate, params.actor)) {
    return false
  }

  return isAuthorizedReadActor(params.actor, params.sourceOwner)
}
