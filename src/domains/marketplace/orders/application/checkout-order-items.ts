import type { ResolvedCheckoutVariant } from './checkout-variant.resolver'

export type CheckoutOrderItemPayload = {
  order_id: string
  listing_id: string
  variant_id: string
  quantity: number
  title_snapshot: string
  variant_snapshot: { sku: string; attributes_json: Record<string, unknown> }
  price_snapshot: number
}

/**
 * ADR-R6E-001: order_item.variant_id is always listing_variant.id (never offer_variant.id).
 */
export function buildOrderItemsPayloadFromResolved(
  orderId: string,
  resolvedLines: Array<{
    item: {
      quantity: number
      unitPrice: number
      title: string
    }
    variantInfo: ResolvedCheckoutVariant
  }>,
): CheckoutOrderItemPayload[] {
  return resolvedLines.map(({ item, variantInfo }) => ({
    order_id: orderId,
    listing_id: variantInfo.listingId,
    variant_id: variantInfo.listingVariantId,
    quantity: item.quantity,
    title_snapshot: item.title,
    variant_snapshot: {
      sku: variantInfo.sku,
      attributes_json: variantInfo.attributesJson,
    },
    price_snapshot: item.unitPrice,
  }))
}

/**
 * ADR-R6E-001: Ensures every resolved line has a listing_variant id for order insert.
 */
export function assertResolvedCheckoutVariantsForOrder(
  resolvedLines: Array<{
    item: { variantId: string }
    variantInfo: ResolvedCheckoutVariant
  }>,
): void {
  for (const { item, variantInfo } of resolvedLines) {
    if (!variantInfo.listingVariantId) {
      throw new Error('ADR-R6E-001: checkout line missing listingVariantId')
    }
    if (
      process.env.NODE_ENV === 'development' &&
      item.variantId !== variantInfo.listingVariantId
    ) {
      console.info(
        `[commercial-identity] legacy cart variantId=${item.variantId} → order variant_id=${variantInfo.listingVariantId}`,
      )
    }
  }
}
