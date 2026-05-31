import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  createUsesRelation,
  CreateUsesRelationError,
} from '@/domains/marketplace/relations/application/commands/create-uses-relation.command'
import {
  existsUsesRelation,
  insertUsesRelation,
  loadPublicationTypesAndOwner,
} from '@/domains/marketplace/relations/infrastructure/relation.repository'

vi.mock('@/domains/marketplace/relations/infrastructure/relation.repository')

const recipePub = {
  id: 'recipe-1',
  publicationType: 'recipe',
  ownerType: 'store',
  ownerId: 'user-1',
}

const productPub = {
  id: 'prod-1',
  publicationType: 'product',
  ownerType: 'store',
  ownerId: 'user-2',
}

describe('createUsesRelation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadPublicationTypesAndOwner).mockImplementation(async (id) => {
      if (id === 'recipe-1') return recipePub
      if (id === 'prod-1') return productPub
      return null
    })
    vi.mocked(existsUsesRelation).mockResolvedValue(false)
    vi.mocked(insertUsesRelation).mockResolvedValue({
      id: 'rel-new',
      sourcePublicationId: 'recipe-1',
      targetPublicationId: 'prod-1',
      relationType: 'uses',
      metadata: {},
      visibility: 'inherit',
      validFrom: null,
      validTo: null,
      createdBy: 'user-1',
      createdAt: '2026-01-01T00:00:00Z',
      isActive: true,
    })
  })

  it('creates uses edge for source owner', async () => {
    const result = await createUsesRelation({
      sourceRecipePublicationId: 'recipe-1',
      targetProductPublicationId: 'prod-1',
      actor: { userId: 'user-1' },
    })
    expect(result.relationId).toBe('rel-new')
    expect(insertUsesRelation).toHaveBeenCalledOnce()
  })

  it('allows staff', async () => {
    await createUsesRelation({
      sourceRecipePublicationId: 'recipe-1',
      targetProductPublicationId: 'prod-1',
      actor: { userId: 'stranger', isAdmin: true },
    })
    expect(insertUsesRelation).toHaveBeenCalledOnce()
  })

  it('denies stranger', async () => {
    await expect(
      createUsesRelation({
        sourceRecipePublicationId: 'recipe-1',
        targetProductPublicationId: 'prod-1',
        actor: { userId: 'stranger' },
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' } satisfies Partial<CreateUsesRelationError>)
  })

  it('denies duplicate', async () => {
    vi.mocked(existsUsesRelation).mockResolvedValue(true)
    await expect(
      createUsesRelation({
        sourceRecipePublicationId: 'recipe-1',
        targetProductPublicationId: 'prod-1',
        actor: { userId: 'user-1' },
      }),
    ).rejects.toMatchObject({ code: 'INVARIANT' })
  })

  it('denies missing publication', async () => {
    await expect(
      createUsesRelation({
        sourceRecipePublicationId: 'missing',
        targetProductPublicationId: 'prod-1',
        actor: { userId: 'user-1' },
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('denies recipe → recipe via invariant', async () => {
    vi.mocked(loadPublicationTypesAndOwner).mockImplementation(async (id) => {
      if (id === 'recipe-1') return recipePub
      if (id === 'recipe-2') return { ...recipePub, id: 'recipe-2' }
      return null
    })
    await expect(
      createUsesRelation({
        sourceRecipePublicationId: 'recipe-1',
        targetProductPublicationId: 'recipe-2',
        actor: { userId: 'user-1' },
      }),
    ).rejects.toMatchObject({ code: 'INVARIANT' })
  })
})
