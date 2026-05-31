import type { CommercialSnapshot } from '../dto/commercial-snapshot.dto'
import type { OfferVariant } from '../../domain/entities/offer-variant'
import { resolveDefaultVariant } from '../../domain/policies/offer-policy'

export type ListingVariantRow = {
  id: string
  listing_id: string
  sku: string
  name: string
  price: number
  stock: number
  is_default: boolean
  attributes_json: Record<string, unknown> | null
  created_at: string
}

export function mapListingVariantRowToOfferVariant(
  row: ListingVariantRow,
  offerId: string,
): OfferVariant {
  return {
    id: row.id,
    offerId,
    sku: row.sku,
    name: row.name,
    price: Number(row.price),
    stock: row.stock,
    attributes: row.attributes_json ?? {},
    isDefault: row.is_default,
    isActive: true,
    legacyVariantId: row.id,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  }
}

export function mapListingVariantRowToCommercialSnapshot(
  row: ListingVariantRow,
  publicationId: string,
  activeCount: number,
): CommercialSnapshot {
  return {
    publicationId,
    variantId: row.id,
    price: Number(row.price),
    stock: row.stock,
    hasOptions: activeCount > 1,
    sku: row.sku,
    attributes: row.attributes_json ?? {},
    source: 'legacy',
  }
}

export function mapOfferVariantsToCommercialSnapshot(
  publicationId: string,
  variants: OfferVariant[],
  source: CommercialSnapshot['source'] = 'offer',
): CommercialSnapshot | null {
  const defaultVariant = resolveDefaultVariant(variants)
  if (!defaultVariant) return null

  const activeCount = variants.filter((v) => v.isActive).length

  return {
    publicationId,
    variantId: defaultVariant.id,
    price: defaultVariant.price,
    stock: defaultVariant.stock,
    hasOptions: activeCount > 1,
    sku: defaultVariant.sku,
    attributes: defaultVariant.attributes,
    source,
  }
}
