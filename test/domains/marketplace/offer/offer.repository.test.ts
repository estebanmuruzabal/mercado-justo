import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createClient } from '@/shared/database/supabase/server'
import {
  findByPublicationId,
  findVariants,
  findByLegacyVariantId,
} from '@/domains/marketplace/offer/infrastructure/offer.repository'
import { resolveCommercialSnapshots } from '@/domains/marketplace/offer/application/queries/offer.queries'

vi.mock('@/shared/database/supabase/server')

function chainable(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  return chain
}

describe('offer.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('findByPublicationId returns mapped offer', async () => {
    const mockFrom = vi.fn(() =>
      chainable({
        data: {
          id: 'offer-1',
          publication_id: 'pub-1',
          pricing_model: 'fixed',
          currency: 'ARS',
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    )
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const offer = await findByPublicationId('pub-1')
    expect(offer?.id).toBe('offer-1')
    expect(offer?.pricingModel).toBe('fixed')
  })

  it('findVariants returns active variants only', async () => {
    let call = 0
    const mockFrom = vi.fn(() => {
      call += 1
      if (call === 1) {
        return chainable({
          data: {
            id: 'offer-1',
            publication_id: 'pub-1',
            pricing_model: 'hourly',
            currency: 'ARS',
            is_active: true,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          error: null,
        })
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'v1',
              offer_id: 'offer-1',
              sku: null,
              name: 'M',
              price: 100,
              stock: 5,
              attributes_json: {},
              is_default: true,
              is_active: true,
              legacy_variant_id: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        }),
      }
    })
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const variants = await findVariants('pub-1')
    expect(variants).toHaveLength(1)
    expect(variants[0]?.price).toBe(100)
    expect(variants[0]?.isDefault).toBe(true)
  })

  it('findByLegacyVariantId returns null for inactive variant', async () => {
    const mockFrom = vi.fn(() =>
      chainable({
        data: {
          id: 'v1',
          offer_id: 'offer-1',
          sku: null,
          name: null,
          price: 100,
          stock: null,
          attributes_json: {},
          is_default: false,
          is_active: false,
          legacy_variant_id: 'legacy-1',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    )
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const variant = await findByLegacyVariantId('legacy-1')
    expect(variant).toBeNull()
  })
})

describe('resolveCommercialSnapshots', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns offer snapshots for publications with offer variants', async () => {
    vi.doMock('@/domains/marketplace/offer/infrastructure/offer.repository', () => ({
      findVariantsByPublicationIds: vi.fn().mockResolvedValue(
        new Map([
          [
            'pub-1',
            [
              {
                id: 'v1',
                offerId: 'o1',
                sku: null,
                name: null,
                price: 999,
                stock: 2,
                attributes: {},
                isDefault: true,
                isActive: true,
                legacyVariantId: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
              },
            ],
          ],
        ]),
      ),
      findLegacyVariantsByPublicationIds: vi.fn().mockResolvedValue(new Map()),
    }))

    const { resolveCommercialSnapshots: resolve } = await import(
      '@/domains/marketplace/offer/application/queries/offer.queries'
    )
    const snapshots = await resolve(['pub-1'])
    expect(snapshots.get('pub-1')).toMatchObject({
      publicationId: 'pub-1',
      price: 999,
      source: 'offer',
    })
  })

  it('falls back to legacy variants when offer path is empty', async () => {
    vi.doMock('@/domains/marketplace/offer/infrastructure/offer.repository', () => ({
      findVariantsByPublicationIds: vi.fn().mockResolvedValue(new Map()),
      findLegacyVariantsByPublicationIds: vi.fn().mockResolvedValue(
        new Map([
          [
            'pub-2',
            [
              {
                id: 'lv-1',
                offerId: 'listing-1',
                sku: 'S',
                name: 'L',
                price: 50,
                stock: 1,
                attributes: {},
                isDefault: true,
                isActive: true,
                legacyVariantId: 'lv-1',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
              },
            ],
          ],
        ]),
      ),
    }))

    const { resolveCommercialSnapshots: resolve } = await import(
      '@/domains/marketplace/offer/application/queries/offer.queries'
    )
    const snapshots = await resolve(['pub-2'])
    expect(snapshots.get('pub-2')?.source).toBe('legacy')
  })
})
