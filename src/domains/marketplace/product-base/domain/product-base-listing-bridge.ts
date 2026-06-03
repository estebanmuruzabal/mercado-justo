import type { ProductBaseType } from './product-base'

export type ListingDbType = 'product' | 'service' | 'property' | 'experience' | 'dittobot'

export function resolveListingDbTypeFromProductBaseType(type: ProductBaseType): ListingDbType {
  switch (type) {
    case 'PRODUCT':
      return 'product'
    case 'DITTOBOT':
      return 'dittobot'
    case 'SERVICE':
      return 'service'
    case 'PROPERTY':
      return 'property'
    case 'EXPERIENCE':
      return 'experience'
    case 'DITTO_RECIPE':
      throw new Error('Las plantillas DITTO_RECIPE no usan ListingManager.')
    default: {
      const _exhaustive: never = type
      throw new Error(`Tipo de plantilla no soportado: ${_exhaustive}`)
    }
  }
}

export function publicationTypeFromProductBaseType(type: ProductBaseType): string {
  if (type === 'DITTOBOT') return 'dittobot'
  if (type === 'DITTO_RECIPE') return 'recipe'
  return type.toLowerCase()
}

export function productBaseTypeUsesListingLocation(type: ProductBaseType): boolean {
  return type === 'PRODUCT' || type === 'DITTOBOT'
}
