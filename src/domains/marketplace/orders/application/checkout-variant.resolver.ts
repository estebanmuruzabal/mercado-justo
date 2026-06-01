/**
 * Checkout variant resolution (ADR-R6E-001).
 *
 * order_item.variant_id and all transactional FKs use listing_variant.id.
 * offer_variant.id must not cross transactional boundaries; the offer→listing
 * branch below is for legacy carts only (see checkout-variant-fallback.metrics).
 */
import { createClient } from '@/shared/database/supabase/server'

import {
  recordCheckoutVariantFallbackHit,
} from './checkout-variant-fallback.metrics'

export type ResolvedCheckoutVariant = {
  cartVariantId: string
  listingVariantId: string
  listingId: string
  sku: string
  attributesJson: Record<string, unknown>
}

type ListingVariantRow = {
  id: string
  listing_id: string
  sku: string
  attributes_json: Record<string, unknown> | null
}

export async function resolveCheckoutVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cartVariantIds: string[],
): Promise<Map<string, ResolvedCheckoutVariant>> {
  const uniqueIds = [...new Set(cartVariantIds)]
  const resolved = new Map<string, ResolvedCheckoutVariant>()
  if (uniqueIds.length === 0) return resolved

  const { data: listingVariantRows, error: listingError } = await supabase
    .from('listing_variant')
    .select('id, listing_id, sku, attributes_json')
    .in('id', uniqueIds)

  if (listingError) throw listingError

  const listingVariantsById = new Map<string, ListingVariantRow>()
  for (const row of (listingVariantRows ?? []) as ListingVariantRow[]) {
    listingVariantsById.set(row.id, row)
    resolved.set(row.id, toResolved(row.id, row))
  }

  const missingIds = uniqueIds.filter((id) => !resolved.has(id))
  if (missingIds.length === 0) return resolved

  // Legacy carts only: cart may still hold offer_variant.id (ADR-R6E-001).
  const { data: offerRows, error: offerError } = await supabase
    .from('offer_variant')
    .select('id, legacy_variant_id')
    .in('id', missingIds)
    .eq('is_active', true)

  if (offerError) throw offerError

  const legacyIds = [
    ...new Set(
      ((offerRows ?? []) as Array<{ id: string; legacy_variant_id: string | null }>)
        .map((row) => row.legacy_variant_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  if (legacyIds.length === 0) return resolved

  const { data: legacyVariantRows, error: legacyError } = await supabase
    .from('listing_variant')
    .select('id, listing_id, sku, attributes_json')
    .in('id', legacyIds)

  if (legacyError) throw legacyError

  const legacyById = new Map<string, ListingVariantRow>()
  for (const row of (legacyVariantRows ?? []) as ListingVariantRow[]) {
    legacyById.set(row.id, row)
  }

  const fallbackResolvedCartIds: string[] = []
  for (const offerRow of (offerRows ?? []) as Array<{
    id: string
    legacy_variant_id: string | null
  }>) {
    if (!offerRow.legacy_variant_id) continue
    const listingVariant = legacyById.get(offerRow.legacy_variant_id)
    if (!listingVariant) continue
    resolved.set(offerRow.id, toResolved(offerRow.id, listingVariant))
    fallbackResolvedCartIds.push(offerRow.id)
  }

  if (fallbackResolvedCartIds.length > 0) {
    recordCheckoutVariantFallbackHit(fallbackResolvedCartIds.length)
    if (process.env.NODE_ENV !== 'test') {
      console.info(
        `[commercial-identity] checkout_variant_fallback_hits=${fallbackResolvedCartIds.length} cart_ids=[${fallbackResolvedCartIds.join(',')}]`,
      )
    }
  }

  return resolved
}

function toResolved(cartVariantId: string, row: ListingVariantRow): ResolvedCheckoutVariant {
  return {
    cartVariantId,
    listingVariantId: row.id,
    listingId: row.listing_id,
    sku: row.sku,
    attributesJson: (row.attributes_json ?? {}) as Record<string, unknown>,
  }
}
