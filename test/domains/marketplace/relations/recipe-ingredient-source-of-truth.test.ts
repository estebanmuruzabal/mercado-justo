import { describe, expect, it } from 'vitest'
import {
  assertRecipeIngredientSourceOfTruth,
  linkedProductIdsInJson,
  RecipeIngredientSourceOfTruthError,
} from '@/domains/marketplace/relations/domain/invariants/recipe-ingredient-source-of-truth'

describe('recipe-ingredient source of truth', () => {
  it('allows free ingredients in JSON when not graph-linked', () => {
    expect(() =>
      assertRecipeIngredientSourceOfTruth({
        attributesJson: {
          ingredients: [{ id: '550e8400-e29b-41d4-a716-446655440000', name: 'salt' }],
        },
        linkedProductPublicationIds: ['prod-1'],
      }),
    ).not.toThrow()
  })

  it('denies duplicate linked product in JSON and graph', () => {
    expect(() =>
      assertRecipeIngredientSourceOfTruth({
        attributesJson: {
          ingredients: [{ name: 'tomato', productPublicationId: 'prod-1' }],
        },
        linkedProductPublicationIds: ['prod-1'],
      }),
    ).toThrow(RecipeIngredientSourceOfTruthError)
  })

  it('extracts linked product ids from JSON rows', () => {
    expect(
      linkedProductIdsInJson({
        ingredients: [
          { name: 'a', targetPublicationId: 'p1' },
          { name: 'b', linkedProductId: 'p2' },
        ],
      }),
    ).toEqual(['p1', 'p2'])
  })
})
