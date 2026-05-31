/**
 * R5.2 — Stable protocol input identity (symbols: recipe-ingredient-* until R5.4).
 *
 * Linked protocol input: identity = `uses` relation id (graph edge).
 * Free protocol input: identity = uuid in JSON `ingredients[].id`.
 *
 * Prohibited as primary identity: display name, array index, sort_order.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type LinkedRecipeIngredientIdentity = {
  kind: 'linked'
  relationId: string
}

export type FreeRecipeIngredientIdentity = {
  kind: 'free'
  ingredientId: string
}

export type RecipeIngredientIdentity = LinkedRecipeIngredientIdentity | FreeRecipeIngredientIdentity

export type FreeRecipeIngredient = {
  /** Stable uuid — never array index or sort_order. */
  id: string
  name: string
  quantity?: number | null
  unit?: string | null
  notes?: string | null
}

export class RecipeIngredientIdentityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RecipeIngredientIdentityError'
  }
}

export function isValidIngredientUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export function assertLinkedIngredientIdentity(relationId: string): LinkedRecipeIngredientIdentity {
  if (!relationId.trim()) {
    throw new RecipeIngredientIdentityError('Linked ingredient identity requires a non-empty relation id.')
  }
  return { kind: 'linked', relationId }
}

export function assertFreeIngredientIdentity(ingredient: FreeRecipeIngredient): FreeRecipeIngredientIdentity {
  if (!isValidIngredientUuid(ingredient.id)) {
    throw new RecipeIngredientIdentityError(
      `Free ingredient requires a stable uuid in "id"; got "${ingredient.id}".`,
    )
  }
  if (!ingredient.name.trim()) {
    throw new RecipeIngredientIdentityError('Free ingredient requires a non-empty name.')
  }
  return { kind: 'free', ingredientId: ingredient.id }
}

export function parseFreeIngredientsFromAttributes(
  attributesJson: Record<string, unknown>,
): FreeRecipeIngredient[] {
  const raw = attributesJson.ingredients
  if (!Array.isArray(raw)) return []

  const result: FreeRecipeIngredient[] = []
  for (const row of raw) {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) continue
    const record = row as Record<string, unknown>
    if (typeof record.id !== 'string' || typeof record.name !== 'string') continue
    result.push({
      id: record.id,
      name: record.name,
      quantity: typeof record.quantity === 'number' ? record.quantity : null,
      unit: typeof record.unit === 'string' ? record.unit : null,
      notes: typeof record.notes === 'string' ? record.notes : null,
    })
  }
  return result
}
