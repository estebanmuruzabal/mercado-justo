import type { Json } from '@/shared/types/supabase'

export type CheckoutCartItemInput = {
  variantId: string
  quantity: number
  unitPrice: number
  storeId: string
  title: string
}

export type ResolvedCheckoutLine = {
  item: CheckoutCartItemInput
  variantInfo: {
    listingVariantId: string
    listingId: string
    sku: string
    attributesJson: Record<string, unknown>
  }
}

export type CheckoutListingStockRow = {
  id: string
  store_id: string
  stock: number | null
  title: string | null
}

export function groupCheckoutLinesByVendor(
  resolvedLines: ResolvedCheckoutLine[],
  listingsById: Map<string, CheckoutListingStockRow>,
): Map<string, ResolvedCheckoutLine[]> {
  const groups = new Map<string, ResolvedCheckoutLine[]>()
  for (const line of resolvedLines) {
    const listing = listingsById.get(line.variantInfo.listingId)
    if (!listing) throw new Error(`Listing no encontrado: ${line.variantInfo.listingId}.`)
    const group = groups.get(listing.store_id) ?? []
    group.push(line)
    groups.set(listing.store_id, group)
  }
  return groups
}

export function aggregateCheckoutQuantitiesByListing(
  resolvedLines: ResolvedCheckoutLine[],
): Map<string, number> {
  const requestedByListing = new Map<string, number>()
  for (const line of resolvedLines) {
    requestedByListing.set(
      line.variantInfo.listingId,
      (requestedByListing.get(line.variantInfo.listingId) ?? 0) + line.item.quantity,
    )
  }
  return requestedByListing
}

export function assertCheckoutListingStock(
  requestedByListing: Map<string, number>,
  listingsById: Map<string, CheckoutListingStockRow>,
): void {
  for (const [listingId, quantity] of requestedByListing.entries()) {
    const listing = listingsById.get(listingId)
    const stockBefore = listing?.stock ?? 0
    if (stockBefore < quantity) {
      throw new Error(`Stock insuficiente para ${listing?.title ?? listingId}.`)
    }
  }
}

export function assertNoOwnListings(
  buyerId: string,
  listingsById: Map<string, CheckoutListingStockRow>,
): void {
  const ownListing = [...listingsById.values()].find((listing) => listing.store_id === buyerId)
  if (ownListing) {
    throw new Error('No podés comprar tus propios productos.')
  }
}

export function buildCheckoutRpcLines(resolvedLines: ResolvedCheckoutLine[]): Json[] {
  return resolvedLines.map(({ item, variantInfo }) => ({
    listing_id: variantInfo.listingId,
    variant_id: variantInfo.listingVariantId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    title_snapshot: item.title,
    variant_snapshot: {
      sku: variantInfo.sku,
      attributes_json: variantInfo.attributesJson as Json,
    },
  }) satisfies Json)
}
