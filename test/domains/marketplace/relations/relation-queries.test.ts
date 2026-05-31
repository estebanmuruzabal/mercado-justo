import { describe, expect, it, vi, beforeEach } from 'vitest'
import { resolveRelationSnapshots } from '@/domains/marketplace/relations/application/queries/relation.queries'
import { findRelationsByPublicationIds } from '@/domains/marketplace/relations/infrastructure/relation.repository'

vi.mock('@/domains/marketplace/relations/infrastructure/relation.repository')

const scheduledEdge = () => ({
  relation: {
    id: 'rel-1',
    sourcePublicationId: 'pub-1',
    targetPublicationId: 'pub-2',
    relationType: 'uses' as const,
    metadata: {},
    visibility: 'inherit' as const,
    validFrom: '2099-01-01T00:00:00Z',
    validTo: null,
    createdBy: null,
    createdAt: '2026-01-01T00:00:00Z',
    isActive: true,
  },
  sourcePublication: {
    id: 'pub-1',
    title: 'A',
    publicationType: 'recipe',
    visibility: 'private',
    lifecycleState: 'published',
    ownerType: 'store',
    ownerId: 'user-1',
    attributes: {},
  },
  targetPublication: {
    id: 'pub-2',
    title: 'B',
    publicationType: 'product',
    visibility: 'public',
    lifecycleState: 'published',
    ownerType: 'store',
    ownerId: 'user-2',
    attributes: {},
  },
  anchorPublicationId: 'pub-1',
  direction: 'outgoing' as const,
})

describe('resolveRelationSnapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ignores includePrivate without actor (H1 unauthorized)', async () => {
    vi.mocked(findRelationsByPublicationIds).mockResolvedValue([scheduledEdge()])

    const result = await resolveRelationSnapshots(['pub-1'], { includePrivate: true })
    expect(result.get('pub-1')).toEqual([])
  })

  it('includes non-public edges for authorized source owner (H1 authorized)', async () => {
    vi.mocked(findRelationsByPublicationIds).mockResolvedValue([scheduledEdge()])

    const result = await resolveRelationSnapshots(['pub-1'], {
      includePrivate: true,
      actor: { userId: 'user-1' },
    })
    expect(result.get('pub-1')).toHaveLength(1)
    expect(result.get('pub-1')?.[0]?.version).toBe(1)
  })

  it('includes non-public edges for admin actor (H1 authorized)', async () => {
    vi.mocked(findRelationsByPublicationIds).mockResolvedValue([scheduledEdge()])

    const result = await resolveRelationSnapshots(['pub-1'], {
      includePrivate: true,
      actor: { userId: 'stranger', isAdmin: true },
    })
    expect(result.get('pub-1')).toHaveLength(1)
  })

  it('clamps depth > 1 to 1 with warning in dev', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(findRelationsByPublicationIds).mockResolvedValue([])

    await resolveRelationSnapshots(['pub-1'], { depth: 2 })
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
