/**
 * Canonical listing types — aligned with Supabase enum `listing_type`.
 * UI-only planned types (e.g. experience) live separately.
 */
export const DB_LISTING_TYPES = ['product', 'property', 'service'] as const

export type DbListingType = (typeof DB_LISTING_TYPES)[number]

/** Planned types shown in nav but not yet persisted in DB. */
export const PLANNED_LISTING_TYPES = ['experience'] as const

export type PlannedListingType = (typeof PLANNED_LISTING_TYPES)[number]

export const LISTING_TYPES = [...DB_LISTING_TYPES, ...PLANNED_LISTING_TYPES] as const

export type ListingType = (typeof LISTING_TYPES)[number]

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  product: 'Productos',
  property: 'Propiedades',
  service: 'Servicios',
  experience: 'Experiencias',
}

export function getListingTypeLabel(listingType: ListingType): string {
  return LISTING_TYPE_LABELS[listingType]
}

export function isDbListingType(value: string): value is DbListingType {
  return (DB_LISTING_TYPES as readonly string[]).includes(value)
}
