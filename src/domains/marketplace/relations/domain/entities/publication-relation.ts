import type { RelationType } from '@/domains/marketplace/shared/domain/relation-type-registry'

export type RelationVisibility = 'inherit' | 'public' | 'private'

export type PublicationRelation = {
  id: string
  sourcePublicationId: string
  targetPublicationId: string
  relationType: RelationType
  metadata: Record<string, unknown>
  visibility: RelationVisibility
  validFrom: string | null
  validTo: string | null
  createdBy: string | null
}
