import { createClient } from '@/shared/database/supabase/server'
import type { Offer, OfferVariant } from '../domain/entities/offer'

export async function getOfferByPublicationId(publicationId: string): Promise<Offer | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('offer')
    .select('id, publication_id, pricing_model, currency, is_active, created_at, updated_at')
    .eq('publication_id', publicationId)
    .maybeSingle()

  if (error || !data) return null
  const row = data as Record<string, unknown>
  return {
    id: row.id as string,
    publicationId: row.publication_id as string,
    pricingModel: row.pricing_model as Offer['pricingModel'],
    currency: row.currency as string,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function listOfferVariantsByPublicationId(
  publicationId: string,
): Promise<OfferVariant[]> {
  const offer = await getOfferByPublicationId(publicationId)
  if (!offer) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('offer_variant')
    .select(
      'id, offer_id, sku, name, price, stock, attributes_json, is_default, legacy_variant_id',
    )
    .eq('offer_id', offer.id)
    .order('is_default', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    offerId: row.offer_id as string,
    sku: row.sku as string | null,
    name: row.name as string | null,
    price: Number(row.price),
    stock: row.stock as number | null,
    attributes: (row.attributes_json as Record<string, unknown>) ?? {},
    isDefault: row.is_default as boolean,
    legacyVariantId: row.legacy_variant_id as string | null,
  }))
}

export async function listOfferVariantsByLegacyListingId(
  legacyListingId: string,
): Promise<OfferVariant[]> {
  const supabase = await createClient()
  const { data: pub } = await supabase
    .from('publication')
    .select('id')
    .eq('legacy_listing_id', legacyListingId)
    .maybeSingle()

  if (!pub) return []
  return listOfferVariantsByPublicationId((pub as { id: string }).id)
}
