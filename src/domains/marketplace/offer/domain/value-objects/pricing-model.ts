import type { OfferModel } from '@/domains/marketplace/shared/domain/publication-type-registry'

/** Reserved for DittoWorld commercial models — no pricing logic yet. */
export type PricingModel = 'fixed' | 'rental' | 'ticket' | 'subscription'

export const PRICING_MODELS = ['fixed', 'rental', 'ticket', 'subscription'] as const

const LEGACY_OFFER_MODEL_MAP: Record<OfferModel, PricingModel> = {
  fixed: 'fixed',
  hourly: 'fixed',
  subscription: 'subscription',
  free: 'fixed',
  negotiable: 'fixed',
  none: 'fixed',
}

/** Maps Strangler OfferModel DB values to reserved PricingModel until full migration. */
export function mapLegacyOfferModelToPricingModel(value: string): PricingModel {
  if (value === 'rental' || value === 'ticket' || value === 'subscription' || value === 'fixed') {
    return value
  }
  return LEGACY_OFFER_MODEL_MAP[value as OfferModel] ?? 'fixed'
}
