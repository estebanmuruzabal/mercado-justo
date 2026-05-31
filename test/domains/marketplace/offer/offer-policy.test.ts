import { describe, expect, it, vi } from 'vitest'
import {
  assertSingleDefaultVariant,
  resolveDefaultVariant,
} from '@/domains/marketplace/offer/domain/policies/offer-policy'
import type { OfferVariant } from '@/domains/marketplace/offer/domain/entities/offer-variant'

function variant(partial: Partial<OfferVariant> & Pick<OfferVariant, 'id' | 'offerId'>): OfferVariant {
  return {
    sku: null,
    name: null,
    price: 100,
    stock: 5,
    attributes: {},
    isDefault: false,
    isActive: true,
    legacyVariantId: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('resolveDefaultVariant (A1)', () => {
  it('returns the single default variant (case 1)', () => {
    const m = variant({ id: 'm', offerId: 'o1', isDefault: true, name: 'M' })
    const l = variant({ id: 'l', offerId: 'o1', createdAt: '2026-01-02T00:00:00Z' })
    expect(resolveDefaultVariant([l, m])).toEqual(m)
  })

  it('returns first active by created_at when no default (case 2)', () => {
    const first = variant({ id: 'a', offerId: 'o1', createdAt: '2026-01-01T00:00:00Z' })
    const second = variant({ id: 'b', offerId: 'o1', createdAt: '2026-01-02T00:00:00Z' })
    expect(resolveDefaultVariant([second, first])).toEqual(first)
  })

  it('warns and picks first default when multiple defaults (case 3)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const d1 = variant({
      id: 'd1',
      offerId: 'o1',
      isDefault: true,
      createdAt: '2026-01-01T00:00:00Z',
    })
    const d2 = variant({
      id: 'd2',
      offerId: 'o1',
      isDefault: true,
      createdAt: '2026-01-02T00:00:00Z',
    })
    expect(resolveDefaultVariant([d2, d1])).toEqual(d1)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('ignores inactive variants', () => {
    const inactive = variant({ id: 'x', offerId: 'o1', isDefault: true, isActive: false })
    const active = variant({ id: 'y', offerId: 'o1', createdAt: '2026-01-02T00:00:00Z' })
    expect(resolveDefaultVariant([inactive, active])).toEqual(active)
  })

  it('returns null when no active variants', () => {
    const inactive = variant({ id: 'x', offerId: 'o1', isActive: false })
    expect(resolveDefaultVariant([inactive])).toBeNull()
  })
})

describe('assertSingleDefaultVariant', () => {
  it('does not warn with zero or one default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    assertSingleDefaultVariant([variant({ id: 'a', offerId: 'o1' })])
    assertSingleDefaultVariant([
      variant({ id: 'a', offerId: 'o1', isDefault: true }),
    ])
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
