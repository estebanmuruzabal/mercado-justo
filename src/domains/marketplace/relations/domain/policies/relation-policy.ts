import type { PublicationRelation } from '../entities/publication-relation'
import {
  isAuthorizedReadActor,
  type RelationOwnerContext,
  type RelationReadActor,
} from '../../application/auth/relation-read-authorization.service'

export type RelationStatus = 'active' | 'inactive' | 'scheduled' | 'expired'

export type VisibilityResolution = 'visible' | 'hidden'

export type PublicationVisibilityContext = {
  visibility: string
  lifecycleState: string
}

export function assertNotSelfRelation(sourcePublicationId: string, targetPublicationId: string): void {
  if (sourcePublicationId === targetPublicationId) {
    throw new Error('Self-relations are not allowed')
  }
}

export function resolveRelationStatus(
  relation: Pick<PublicationRelation, 'validFrom' | 'validTo' | 'isActive'>,
  now: Date = new Date(),
): RelationStatus {
  if (relation.isActive === false) {
    return 'inactive'
  }

  if (relation.validFrom) {
    const validFrom = new Date(relation.validFrom)
    if (validFrom.getTime() > now.getTime()) {
      return 'scheduled'
    }
  }

  if (relation.validTo) {
    const validTo = new Date(relation.validTo)
    if (validTo.getTime() < now.getTime()) {
      return 'expired'
    }
  }

  return 'active'
}

export function resolveRelationVisibility(
  relation: Pick<PublicationRelation, 'visibility'>,
  sourcePublication: PublicationVisibilityContext,
  targetPublication: PublicationVisibilityContext,
): VisibilityResolution {
  if (relation.visibility === 'private') {
    return 'hidden'
  }

  if (relation.visibility === 'public' || relation.visibility === 'inherit') {
    return isPublishedPublic(sourcePublication) && isPublishedPublic(targetPublication)
      ? 'visible'
      : 'hidden'
  }

  return 'hidden'
}

export function isPublicRelationEdge(
  relation: PublicationRelation,
  sourcePublication: PublicationVisibilityContext,
  targetPublication: PublicationVisibilityContext,
  now: Date = new Date(),
): boolean {
  return (
    resolveRelationStatus(relation, now) === 'active' &&
    resolveRelationVisibility(relation, sourcePublication, targetPublication) === 'visible'
  )
}

/**
 * @deprecated Use isAuthorizedReadActor from relation-read-authorization.service — TODO(R3.2): remove
 */
export function canBypassPublicRelationFilter(
  actor: RelationReadActor | undefined,
  sourceOwner: RelationOwnerContext,
): boolean {
  return isAuthorizedReadActor(actor, sourceOwner)
}

function isPublishedPublic(publication: PublicationVisibilityContext): boolean {
  return publication.visibility === 'public' && publication.lifecycleState === 'published'
}

export function getSortOrder(metadata: Record<string, unknown>): number | null {
  const value = metadata.sort_order
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export function compareRelationsDeterministic(
  a: Pick<PublicationRelation, 'id' | 'createdAt' | 'metadata'>,
  b: Pick<PublicationRelation, 'id' | 'createdAt' | 'metadata'>,
): number {
  const sortA = getSortOrder(a.metadata)
  const sortB = getSortOrder(b.metadata)

  if (sortA !== null && sortB !== null && sortA !== sortB) {
    return sortA - sortB
  }
  if (sortA !== null && sortB === null) return -1
  if (sortA === null && sortB !== null) return 1

  const createdCompare = a.createdAt.localeCompare(b.createdAt)
  if (createdCompare !== 0) return createdCompare

  return a.id.localeCompare(b.id)
}
