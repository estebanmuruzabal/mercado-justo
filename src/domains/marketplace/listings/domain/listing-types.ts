/**
 * @deprecated Import from `@/domains/marketplace/shared/domain/publication-type-registry` instead.
 * Re-exports for backward compatibility during Publication migration.
 */
import {
  ALL_PUBLICATION_TYPE_CODES,
  LEGACY_DB_LISTING_TYPES,
  PERSISTABLE_PUBLICATION_TYPES,
  UI_PUBLICATION_TYPES,
  UI_PUBLICATION_TYPE_LABELS,
  getPublicationTypeLabel,
  isLegacyDbListingType,
  type LegacyDbListingType,
  type PublicationTypeCode,
} from '@/domains/marketplace/shared/domain/publication-type-registry'

export {
  LEGACY_DB_LISTING_TYPES as DB_LISTING_TYPES,
  type LegacyDbListingType as DbListingType,
  UI_PUBLICATION_TYPES as LISTING_TYPES,
  UI_PUBLICATION_TYPE_LABELS as LISTING_TYPE_LABELS,
  getPublicationTypeLabel as getListingTypeLabel,
  isLegacyDbListingType as isDbListingType,
  PERSISTABLE_PUBLICATION_TYPES,
  ALL_PUBLICATION_TYPE_CODES,
}

/** @deprecated Use registry filter for non-persistable types instead. */
export const PLANNED_LISTING_TYPES = ALL_PUBLICATION_TYPE_CODES.filter(
  (code) => !PERSISTABLE_PUBLICATION_TYPES.includes(code),
)

export type PlannedListingType = Exclude<
  PublicationTypeCode,
  (typeof PERSISTABLE_PUBLICATION_TYPES)[number]
>

export type ListingType = PublicationTypeCode
