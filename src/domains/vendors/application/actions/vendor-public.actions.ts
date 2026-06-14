'use server'

import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'
import type { VendorReviewsPage } from '@/domains/vendors/domain/vendor'
import { getVendorListings, getVendorReviews } from '@/domains/vendors/application/queries/vendor.queries'

export async function loadVendorListingsAction(input: {
  storeId: string
  storeName?: string
  offset: number
  limit?: number
  listingType?: ListingType
}): Promise<MarketplaceListing[]> {
  return getVendorListings({
    storeId: input.storeId,
    storeName: input.storeName,
    offset: input.offset,
    limit: input.limit ?? 12,
    listingType: input.listingType,
  })
}

export async function loadVendorReviewsAction(input: {
  storeId: string
  offset: number
  limit?: number
}): Promise<VendorReviewsPage> {
  return getVendorReviews({
    storeId: input.storeId,
    offset: input.offset,
    limit: input.limit ?? 8,
  })
}
