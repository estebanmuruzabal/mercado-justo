import type { OfferVariant } from '../entities/offer-variant'

export class MultipleDefaultVariantsError extends Error {
  constructor(offerId: string) {
    super(`Offer ${offerId} has multiple active default variants`)
    this.name = 'MultipleDefaultVariantsError'
  }
}

export function assertOfferReadOnly(): void {
  throw new Error('Offer BC is read-only. Writes go through listing_variant Strangler.')
}

export function assertSingleDefaultVariant(variants: OfferVariant[]): void {
  const activeDefaults = variants.filter((v) => v.isActive && v.isDefault)
  if (activeDefaults.length > 1) {
    console.warn(
      `Multiple default variants detected for offer ${activeDefaults[0]?.offerId}: using first active default`,
    )
  }
}

export function resolveDefaultVariant(variants: OfferVariant[]): OfferVariant | null {
  const active = variants.filter((v) => v.isActive)
  if (active.length === 0) return null

  const defaults = active.filter((v) => v.isDefault)
  if (defaults.length === 1) return defaults[0] ?? null

  if (defaults.length > 1) {
    assertSingleDefaultVariant(variants)
    return [...defaults].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] ?? null
  }

  return [...active].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] ?? null
}
