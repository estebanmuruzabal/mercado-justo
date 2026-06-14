import type { Publication } from '../domain/entities/publication'
import { geoFromListingRow } from '../domain/value-objects/geo-location'
import { emptySeoMetadata } from '../domain/value-objects/seo-metadata'
import { lifecycleFromListingRow } from '@/domains/marketplace/shared/domain/lifecycle-state'
import {
  getPublicationTypeDefinition,
  isLegacyDbListingType,
} from '@/domains/marketplace/shared/domain/publication-type-registry'
import { structuralRoleFromLegacyKind } from '@/domains/marketplace/shared/domain/structural-role'
import {
  ownerRefFromListingRow,
  ownerRefFromPublicationRow,
} from '@/domains/marketplace/shared/application/ownership-policy'

export type ListingRowForPublication = {
  id: string
  title: string | null
  description: string | null
  listing_type: string
  category_id: string
  store_id: string
  status: string
  moderation_status: string
  moderation_reason: string | null
  characteristics: Record<string, unknown> | null
  latitude: number | null
  longitude: number | null
  created_at: string
  owner_type?: string | null
  owner_id?: string | null
  structural_role?: string | null
  parent_publication_id?: string | null
  kind?: string | null
  taxonomy_path?: string | null
  visibility?: string | null
  view_count?: number | null
  follower_count?: number | null
  review_count?: number | null
  rating_avg?: number | null
  published_at?: string | null
  archived_at?: string | null
  updated_at?: string | null
}

/** Maps legacy `listing` row (or synced `publication` row) to domain Publication. */
export function publicationFromListingRow(row: ListingRowForPublication): Publication {
  const publicationType = row.listing_type
  const typeDef = getPublicationTypeDefinition(publicationType)
  const lifecycle = lifecycleFromListingRow({
    status: row.status,
    moderation_status: row.moderation_status,
  })

  const owner =
    row.owner_type && row.owner_id
      ? ownerRefFromPublicationRow({
          owner_type: row.owner_type,
          owner_id: row.owner_id,
          store_id: row.store_id,
        })
      : ownerRefFromListingRow(row.store_id)

  const structuralRole = row.structural_role
    ? (row.structural_role as Publication['structuralRole'])
    : structuralRoleFromLegacyKind(row.kind)

  return {
    id: row.id,
    publicationType,
    structuralRole,
    parentPublicationId: row.parent_publication_id ?? null,
    owner,
    taxonomyNodeId: row.category_id,
    taxonomyPath: row.taxonomy_path ?? null,
    lifecycle,
    visibility: (row.visibility as Publication['visibility']) ?? 'public',
    moderationStatus: row.moderation_status,
    moderationReason: row.moderation_reason,
    title: row.title,
    summary: null,
    body: row.description,
    seo: emptySeoMetadata(),
    attributes: row.characteristics ?? {},
    location: geoFromListingRow(row),
    offerModel: typeDef?.defaultOfferModel ?? 'fixed',
    isTransactable: typeDef?.capabilities.includes('transactable') ?? false,
    stats: {
      viewCount: row.view_count ?? 0,
      followerCount: row.follower_count ?? 0,
      reviewCount: row.review_count ?? 0,
      ratingAvg: Number(row.rating_avg ?? 0),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    publishedAt: row.published_at ?? null,
    archivedAt: row.archived_at ?? null,
  }
}

export function listingTypeForPublication(publication: Publication): string {
  if (isLegacyDbListingType(publication.publicationType)) {
    return publication.publicationType
  }
  return 'product'
}
