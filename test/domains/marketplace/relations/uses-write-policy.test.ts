import { describe, expect, it } from 'vitest'
import {
  assertMvpWriteRelationType,
  assertUsesRelationWrite,
  UsesRelationWriteError,
} from '@/domains/marketplace/relations/domain/policies/uses-write-policy'

describe('uses-write-policy', () => {
  it('allows uses relation type', () => {
    expect(() => assertMvpWriteRelationType('uses')).not.toThrow()
  })

  it('rejects blocked relation types', () => {
    expect(() => assertMvpWriteRelationType('hosted_at')).toThrow(UsesRelationWriteError)
    expect(() => assertMvpWriteRelationType('commercial_variant_of')).toThrow(UsesRelationWriteError)
  })

  it('rejects wrong relation type', () => {
    expect(() => assertMvpWriteRelationType('unknown')).toThrow(UsesRelationWriteError)
  })

  it('allows recipe → product pairing', () => {
    expect(() =>
      assertUsesRelationWrite({
        sourcePublicationId: 'recipe-1',
        targetPublicationId: 'prod-1',
        sourcePublicationType: 'recipe',
        targetPublicationType: 'product',
      }),
    ).not.toThrow()
  })

  it('denies self relation', () => {
    expect(() =>
      assertUsesRelationWrite({
        sourcePublicationId: 'same',
        targetPublicationId: 'same',
        sourcePublicationType: 'recipe',
        targetPublicationType: 'product',
      }),
    ).toThrow(UsesRelationWriteError)
  })

  it('denies recipe → recipe', () => {
    expect(() =>
      assertUsesRelationWrite({
        sourcePublicationId: 'r1',
        targetPublicationId: 'r2',
        sourcePublicationType: 'recipe',
        targetPublicationType: 'recipe',
      }),
    ).toThrow(UsesRelationWriteError)
  })

  it('denies product → product', () => {
    expect(() =>
      assertUsesRelationWrite({
        sourcePublicationId: 'p1',
        targetPublicationId: 'p2',
        sourcePublicationType: 'product',
        targetPublicationType: 'product',
      }),
    ).toThrow(UsesRelationWriteError)
  })

  it('denies duplicate', () => {
    expect(() =>
      assertUsesRelationWrite({
        sourcePublicationId: 'recipe-1',
        targetPublicationId: 'prod-1',
        sourcePublicationType: 'recipe',
        targetPublicationType: 'product',
        alreadyExists: true,
      }),
    ).toThrow(UsesRelationWriteError)
  })
})
