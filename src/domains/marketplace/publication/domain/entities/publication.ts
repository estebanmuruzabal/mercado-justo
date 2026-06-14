import type { StructuralRole } from '@/domains/marketplace/shared/domain/structural-role'
import type { LifecycleState } from '@/domains/marketplace/shared/domain/lifecycle-state'
import type { Visibility } from '@/domains/marketplace/shared/domain/visibility'
import type { OfferModel } from '@/domains/marketplace/shared/domain/publication-type-registry'
import type { OwnerRef } from '../value-objects/owner-ref'
import type { SeoMetadata } from '../value-objects/seo-metadata'
import type { GeoLocation } from '../value-objects/geo-location'
import type { PublicationStatsSnapshot } from '../value-objects/publication-stats'

export type PublicationId = string

/** Universal publishable entity — aggregate root for Marketplace. */
export type Publication = {
  id: PublicationId
  publicationType: string
  structuralRole: StructuralRole
  /** @deprecated Use PublicationRelation — kept during Strangler migration */
  parentPublicationId: string | null
  owner: OwnerRef
  taxonomyNodeId: string
  taxonomyPath: string | null
  lifecycle: LifecycleState
  visibility: Visibility
  moderationStatus: string
  moderationReason: string | null
  title: string | null
  summary: string | null
  body: string | null
  seo: SeoMetadata
  attributes: Record<string, unknown>
  location: GeoLocation
  offerModel: OfferModel
  isTransactable: boolean
  stats: PublicationStatsSnapshot
  createdAt: string
  updatedAt: string | null
  publishedAt: string | null
  archivedAt: string | null
}

export type PublicationContent = Pick<
  Publication,
  'title' | 'summary' | 'body' | 'seo' | 'attributes'
>
