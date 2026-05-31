import type { RelationType } from '../../domain/registry/relation-type-registry'

export type RelationDto = {
  id: string
  sourcePublicationId: string
  targetPublicationId: string
  relationType: RelationType
}
