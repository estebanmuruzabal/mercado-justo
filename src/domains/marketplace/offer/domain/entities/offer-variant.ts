export type OfferVariant = {
  id: string
  offerId: string
  sku: string | null
  name: string | null
  price: number
  stock: number | null
  attributes: Record<string, unknown>
  isDefault: boolean
  isActive: boolean
  legacyVariantId: string | null
  createdAt: string
  updatedAt: string
}
