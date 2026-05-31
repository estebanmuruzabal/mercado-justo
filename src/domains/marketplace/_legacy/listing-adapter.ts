/**
 * @deprecated Strangler adapter — prefer `@/domains/marketplace/publication` repository.
 * Kept for legacy listing row → Publication mapping during migration.
 */
export {
  publicationFromListingRow,
  listingTypeForPublication,
  type ListingRowForPublication,
} from '@/domains/marketplace/publication/infrastructure/listing-adapter'
