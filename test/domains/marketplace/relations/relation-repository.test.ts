import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createClient } from '@/shared/database/supabase/server'
import { findRelationsByPublicationIds } from '@/domains/marketplace/relations/infrastructure/relation.repository'

vi.mock('@/shared/database/supabase/server')

describe('findRelationsByPublicationIds ordering (C3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns rows sorted deterministically after fetch', async () => {
    const rows = [
      {
        id: 'rel-c',
        source_publication_id: 'pub-1',
        target_publication_id: 't3',
        relation_type: 'uses',
        metadata_json: { sort_order: 2 },
        visibility: 'public',
        valid_from: null,
        valid_to: null,
        created_by: null,
        created_at: '2026-01-03T00:00:00Z',
        source: {
          id: 'pub-1',
          title: 'S',
          publication_type: 'recipe',
          visibility: 'public',
          lifecycle_state: 'published',
          attributes_json: {},
          owner_type: 'store',
          owner_id: 'user-1',
        },
        target: {
          id: 't3',
          title: 'T3',
          publication_type: 'product',
          visibility: 'public',
          lifecycle_state: 'published',
          attributes_json: {},
          owner_type: 'store',
          owner_id: 'user-2',
        },
      },
      {
        id: 'rel-a',
        source_publication_id: 'pub-1',
        target_publication_id: 't1',
        relation_type: 'uses',
        metadata_json: { sort_order: 1 },
        visibility: 'public',
        valid_from: null,
        valid_to: null,
        created_by: null,
        created_at: '2026-01-01T00:00:00Z',
        source: {
          id: 'pub-1',
          title: 'S',
          publication_type: 'recipe',
          visibility: 'public',
          lifecycle_state: 'published',
          attributes_json: {},
          owner_type: 'store',
          owner_id: 'user-1',
        },
        target: {
          id: 't1',
          title: 'T1',
          publication_type: 'product',
          visibility: 'public',
          lifecycle_state: 'published',
          attributes_json: {},
          owner_type: 'store',
          owner_id: 'user-2',
        },
      },
    ]

    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: rows, error: null }),
    }))

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const result = await findRelationsByPublicationIds(['pub-1'])
    expect(result.map((r) => r.relation.id)).toEqual(['rel-a', 'rel-c'])
  })
})
