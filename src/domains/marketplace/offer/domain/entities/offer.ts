import type { OfferModel } from '@/domains/marketplace/shared/domain/publication-type-registry'

export type Offer = {
  id: string
  publicationId: string
  pricingModel: OfferModel
  currency: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type OfferVariant = {
  id: string
  offerId: string
  sku: string | null
  name: string | null
  price: number
  stock: number | null
  attributes: Record<string, unknown>
  isDefault: boolean
  legacyVariantId: string | null
}
