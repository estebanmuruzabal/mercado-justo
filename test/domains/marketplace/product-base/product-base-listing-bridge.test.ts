import { describe, expect, it } from 'vitest'

import {
  productBaseTypeUsesListingLocation,
  publicationTypeFromProductBaseType,
  resolveListingDbTypeFromProductBaseType,
} from '@/domains/marketplace/product-base/domain/product-base-listing-bridge'

describe('product-base-listing-bridge', () => {
  it('uses listing_type=dittobot as canonical DittoBot identity', () => {
    expect(resolveListingDbTypeFromProductBaseType('DITTOBOT')).toBe('dittobot')
    expect(publicationTypeFromProductBaseType('DITTOBOT')).toBe('dittobot')
    expect(productBaseTypeUsesListingLocation('DITTOBOT')).toBe(true)
  })

  it('maps regular Product Base types to listing_type enum values', () => {
    expect(resolveListingDbTypeFromProductBaseType('PRODUCT')).toBe('product')
    expect(resolveListingDbTypeFromProductBaseType('SERVICE')).toBe('service')
    expect(resolveListingDbTypeFromProductBaseType('PROPERTY')).toBe('property')
    expect(resolveListingDbTypeFromProductBaseType('EXPERIENCE')).toBe('experience')
  })
})
