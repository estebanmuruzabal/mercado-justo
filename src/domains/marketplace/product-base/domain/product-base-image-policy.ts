import type { ProductBaseImageStrategy } from './product-base'

export function productBaseAllowsSellerListingImages(strategy: ProductBaseImageStrategy): boolean {
  return strategy === 'LISTING_REQUIRED' || strategy === 'BASE_OR_LISTING'
}
