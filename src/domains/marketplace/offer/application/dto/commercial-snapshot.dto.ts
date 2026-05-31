export type CommercialSnapshot = {
  publicationId: string
  variantId: string | null
  price: number | null
  stock: number | null
  hasOptions: boolean
  sku?: string | null
  /** Default variant attributes for feed title/image fallback */
  attributes?: Record<string, unknown> | null
  /** 'offer' = offer_variant; 'legacy' = Strangler fallback (opaque to consumers) */
  source: 'offer' | 'legacy'
}
