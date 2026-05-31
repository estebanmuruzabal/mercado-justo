import type { RelationType } from '../registry/relation-type-registry'

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
  createdAt: string
  /** Default true in domain; DB column arrives in R3.2 (B3). */
  isActive: boolean
}
