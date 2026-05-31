import type { RelationStatus } from '../../domain/policies/relation-policy'
import type { RelationType } from '../../domain/registry/relation-type-registry'
import type { RelationVisibility } from '../../domain/entities/publication-relation'

export type { RelationStatus }

export type RelatedPublicationSummary = {
  id: string
  title: string
  publicationType: string
  coverImage?: string | null
}

export type RelationSnapshot = {
  version: 1
  relationId: string
  publicationId: string
  relatedPublicationId: string
  relationType: RelationType
  direction: 'outgoing' | 'incoming'
  metadata: Record<string, unknown>
  visibility: RelationVisibility
  sortOrder?: number
  relatedPublication: RelatedPublicationSummary
}

/**
 * Authorization context for non-public relation reads.
 * Required when `includePrivate` is true.
 */
export type RelationReadActor = {
  userId: string
  isAdmin?: boolean
  /** Reserved for R3.1 service-role reads. */
  serviceRole?: boolean
}

export type ResolveRelationSnapshotsOptions = {
  direction?: 'outgoing' | 'incoming' | 'both'
  relationTypes?: RelationType[]
  /**
   * Include non-public edges (scheduled/expired/inherit-hidden) for authorized actors.
   * Ignored unless `actor` is provided — falls back to public filtering.
   *
   * R3.0 limitation: current RLS only returns edges with visibility `public` or `inherit`.
   * Edges with visibility `private` are not accessible until R3.1 owner-aware RLS.
   *
   * TODO(R3.1): Private relations become fully accessible only after owner-aware RLS policies.
   */
  includePrivate?: boolean
  /** Required for includePrivate to take effect. Source-owner, admin, or serviceRole. */
  actor?: RelationReadActor
  depth?: 1 | 2
}
