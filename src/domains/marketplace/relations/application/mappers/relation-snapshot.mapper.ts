import type { RelationSnapshot, RelatedPublicationSummary } from '../dto/relation-snapshot.dto'
import { getSortOrder } from '../../domain/policies/relation-policy'
import type { RelationReadRow } from '../../infrastructure/relation.repository'

function toRelatedPublicationSummary(
  publication: RelationReadRow['sourcePublication'],
): RelatedPublicationSummary {
  const attrs = publication.attributes
  const coverImage = typeof attrs.image === 'string' ? attrs.image : null

  return {
    id: publication.id,
    title: publication.title ?? '',
    publicationType: publication.publicationType,
    coverImage,
  }
}

export function mapRelationReadRowToSnapshot(row: RelationReadRow): RelationSnapshot {
  const relatedPublication =
    row.direction === 'outgoing'
      ? toRelatedPublicationSummary(row.targetPublication)
      : toRelatedPublicationSummary(row.sourcePublication)

  const sortOrder = getSortOrder(row.relation.metadata)

  return {
    version: 1,
    relationId: row.relation.id,
    publicationId: row.anchorPublicationId,
    relatedPublicationId: relatedPublication.id,
    relationType: row.relation.relationType,
    direction: row.direction,
    metadata: row.relation.metadata,
    visibility: row.relation.visibility,
    ...(sortOrder !== null ? { sortOrder } : {}),
    relatedPublication,
  }
}
