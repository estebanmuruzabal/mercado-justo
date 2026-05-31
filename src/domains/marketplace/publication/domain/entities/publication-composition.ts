/**
 * @deprecated Use relations subdomain — PublicationComposition converges to PublicationRelation.
 */
import type { RelationType } from '@/domains/marketplace/shared/domain/relation-type-registry'
import { relationTypeFromLegacyComposition } from '@/domains/marketplace/shared/domain/relation-type-registry'

export type PublicationComposition = {
  id: string
  parentPublicationId: string
  childPublicationId: string
  compositionType: string
  sortOrder: number
}

export function legacyCompositionToRelationType(compositionType: string): RelationType {
  return relationTypeFromLegacyComposition(compositionType)
}
