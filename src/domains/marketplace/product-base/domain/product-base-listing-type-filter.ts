import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { ProductBaseType } from './product-base'

export function productBaseTypesForListingType(listingType: ListingType): ProductBaseType[] {
  switch (listingType) {
    case 'product':
      return ['PRODUCT']
    case 'service':
      return ['SERVICE']
    case 'property':
      return ['PROPERTY']
    case 'dittobot':
      return ['DITTOBOT']
    case 'experience':
      return ['EXPERIENCE']
    default:
      return []
  }
}

export function isProductBaseCompatibleWithListingType(
  productBaseType: ProductBaseType,
  listingType: ListingType,
): boolean {
  return productBaseTypesForListingType(listingType).includes(productBaseType)
}
