import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import { LISTING_TYPE_LABELS, LISTING_TYPES } from '@/domains/marketplace/listings/domain/listing'

export type NavbarListingType = ListingType

export const NAVBAR_TABS: Array<{ id: NavbarListingType; label: string }> = LISTING_TYPES.map((id) => ({
  id,
  label: LISTING_TYPE_LABELS[id],
}))

