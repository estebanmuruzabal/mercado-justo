import { createClient } from '@/shared/database/supabase/server'
import type { Offer } from '../domain/entities/offer'
import type { OfferVariant } from '../domain/entities/offer-variant'
import { resolveDefaultVariant } from '../domain/policies/offer-policy'
import { mapLegacyOfferModelToPricingModel } from '../domain/value-objects/pricing-model'
import {
  mapListingVariantRowToOfferVariant,
  type ListingVariantRow,
} from '../application/mappers/listing-variant-adapter'

function mapOfferRow(row: Record<string, unknown>): Offer {
  return {
    id: row.id as string,
    publicationId: row.publication_id as string,
    pricingModel: mapLegacyOfferModelToPricingModel(String(row.pricing_model)),
    currency: row.currency as string,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapOfferVariantRow(row: Record<string, unknown>): OfferVariant {
  return {
    id: row.id as string,
    offerId: row.offer_id as string,
    sku: row.sku as string | null,
    name: row.name as string | null,
    price: Number(row.price),
    stock: row.stock as number | null,
    attributes: (row.attributes_json as Record<string, unknown>) ?? {},
    isDefault: row.is_default as boolean,
    isActive: (row.is_active as boolean | undefined) ?? true,
    legacyVariantId: row.legacy_variant_id as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

/** @internal */
export async function findByPublicationId(publicationId: string): Promise<Offer | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('offer')
    .select('id, publication_id, pricing_model, currency, is_active, created_at, updated_at')
    .eq('publication_id', publicationId)
    .maybeSingle()

  if (error || !data) return null
  return mapOfferRow(data as Record<string, unknown>)
}

/** @internal */
export async function findVariants(publicationId: string): Promise<OfferVariant[]> {
  const offer = await findByPublicationId(publicationId)
  if (!offer || !offer.isActive) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('offer_variant')
    .select(
      'id, offer_id, sku, name, price, stock, attributes_json, is_default, is_active, legacy_variant_id, created_at, updated_at',
    )
    .eq('offer_id', offer.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => mapOfferVariantRow(row as Record<string, unknown>))
}

/** @internal */
export async function findDefaultVariant(publicationId: string): Promise<OfferVariant | null> {
  const variants = await findVariants(publicationId)
  return resolveDefaultVariant(variants)
}

/** @internal */
export async function findByLegacyVariantId(legacyVariantId: string): Promise<OfferVariant | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('offer_variant')
    .select(
      'id, offer_id, sku, name, price, stock, attributes_json, is_default, is_active, legacy_variant_id, created_at, updated_at',
    )
    .eq('legacy_variant_id', legacyVariantId)
    .maybeSingle()

  if (error || !data) return null
  const variant = mapOfferVariantRow(data as Record<string, unknown>)
  return variant.isActive ? variant : null
}

/** @internal */
export async function findVariantsByPublicationIds(
  publicationIds: string[],
): Promise<Map<string, OfferVariant[]>> {
  const map = new Map<string, OfferVariant[]>()
  if (publicationIds.length === 0) return map

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('offer_variant')
    .select(
      'id, offer_id, sku, name, price, stock, attributes_json, is_default, is_active, legacy_variant_id, created_at, updated_at, offer!inner(publication_id, is_active)',
    )
    .in('offer.publication_id', publicationIds)
    .eq('offer.is_active', true)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error

  for (const row of (data ?? []) as Array<Record<string, unknown> & { offer: { publication_id: string } }>) {
    const publicationId = row.offer.publication_id
    const list = map.get(publicationId) ?? []
    list.push(mapOfferVariantRow(row))
    map.set(publicationId, list)
  }

  return map
}

/** @internal Strangler fallback — listing_variant rows keyed by publication id */
export async function findLegacyVariantsByPublicationIds(
  publicationIds: string[],
): Promise<Map<string, OfferVariant[]>> {
  const map = new Map<string, OfferVariant[]>()
  if (publicationIds.length === 0) return map

  const supabase = await createClient()
  const { data: publications, error: pubError } = await supabase
    .from('publication')
    .select('id, legacy_listing_id')
    .in('id', publicationIds)

  if (pubError) throw pubError

  const listingIdByPublicationId = new Map<string, string>()
  const listingIds: string[] = []
  for (const row of (publications ?? []) as Array<{ id: string; legacy_listing_id: string | null }>) {
    if (row.legacy_listing_id) {
      listingIdByPublicationId.set(row.id, row.legacy_listing_id)
      listingIds.push(row.legacy_listing_id)
    }
  }

  if (listingIds.length === 0) return map

  const { data: variants, error: variantError } = await supabase
    .from('listing_variant')
    .select('id, listing_id, sku, name, price, stock, is_default, attributes_json, created_at')
    .in('listing_id', listingIds)
    .order('created_at', { ascending: true })

  if (variantError) throw variantError

  const variantsByListingId = new Map<string, ListingVariantRow[]>()
  for (const row of (variants ?? []) as ListingVariantRow[]) {
    const list = variantsByListingId.get(row.listing_id) ?? []
    list.push(row)
    variantsByListingId.set(row.listing_id, list)
  }

  for (const [publicationId, listingId] of listingIdByPublicationId) {
    const rows = variantsByListingId.get(listingId) ?? []
    if (rows.length === 0) continue
    map.set(
      publicationId,
      rows.map((row) => mapListingVariantRowToOfferVariant(row, listingId)),
    )
  }

  return map
}
