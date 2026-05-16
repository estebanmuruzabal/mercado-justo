export const LISTING_TYPES = [
  'product',
  'property',
  'experience',
  'service',
] as const

export type ListingType = (typeof LISTING_TYPES)[number]

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  product: 'Productos',
  property: 'Propiedades',
  experience: 'Experiencias',
  service: 'Servicios',
}

export function getListingTypeLabel(listingType: ListingType) {
  return LISTING_TYPE_LABELS[listingType]
}

