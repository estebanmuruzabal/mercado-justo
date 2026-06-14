/**
 * ADR-R6E-001: Commercial identity contract (documentation constant).
 *
 * offer_variant.id must NOT cross transactional boundaries (cart, checkout, order_item,
 * transaction_line, fulfillment, inventory). Persisted FKs use listing_variant.id.
 *
 * Discovery reads publication + Offer BC; CommercialSnapshot.variantId is always
 * listing_variant.id for downstream cart/checkout consumers.
 */
export const COMMERCIAL_IDENTITY_ADR = 'ADR-R6E-001' as const

export const TRANSACTIONAL_VARIANT_ID_CONTRACT =
  'Transactional variant identity is listing_variant.id. Offer variant ids are read-model only.' as const
