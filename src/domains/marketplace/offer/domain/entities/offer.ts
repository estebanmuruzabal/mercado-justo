import type { PricingModel } from '../value-objects/pricing-model'

export type Offer = {
  id: string
  publicationId: string
  pricingModel: PricingModel
  currency: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
