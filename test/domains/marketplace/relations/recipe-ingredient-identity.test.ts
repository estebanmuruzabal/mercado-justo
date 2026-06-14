import { describe, expect, it } from 'vitest'
import {
  assertFreeIngredientIdentity,
  assertLinkedIngredientIdentity,
  isValidIngredientUuid,
  parseFreeIngredientsFromAttributes,
  RecipeIngredientIdentityError,
} from '@/domains/marketplace/relations/domain/contracts/recipe-ingredient-identity'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('recipe-ingredient identity', () => {
  it('linked identity uses relation id', () => {
    expect(assertLinkedIngredientIdentity('rel-abc')).toEqual({
      kind: 'linked',
      relationId: 'rel-abc',
    })
  })

  it('rejects empty linked relation id', () => {
    expect(() => assertLinkedIngredientIdentity('')).toThrow(RecipeIngredientIdentityError)
  })

  it('free identity requires uuid', () => {
    expect(
      assertFreeIngredientIdentity({ id: VALID_UUID, name: 'basil' }),
    ).toEqual({ kind: 'free', ingredientId: VALID_UUID })
  })

  it('rejects non-uuid free ingredient id', () => {
    expect(() =>
      assertFreeIngredientIdentity({ id: 'row-0', name: 'basil' }),
    ).toThrow(RecipeIngredientIdentityError)
  })

  it('validates uuid format', () => {
    expect(isValidIngredientUuid(VALID_UUID)).toBe(true)
    expect(isValidIngredientUuid('not-a-uuid')).toBe(false)
  })

  it('parses free ingredients from attributes', () => {
    const parsed = parseFreeIngredientsFromAttributes({
      ingredients: [{ id: VALID_UUID, name: 'oil', quantity: 2, unit: 'tbsp' }],
    })
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.name).toBe('oil')
  })
})
