/**
 * R5.2 — Protocol input source-of-truth (symbols: recipe-ingredient-* until R5.4).
 *
 * | Protocol input kind | Source of Truth |
 * |---------------------|-----------------|
 * | Linked (product)    | Graph (`uses`) — R5.2 product-only shim; USABLE targets R5.4 |
 * | Free input          | JSON `ingredients[]` |
 */

/** Keys forbidden on JSON ingredient rows when the product is graph-linked. */
export const LINKED_PRODUCT_JSON_KEYS = [
  'productPublicationId',
  'targetPublicationId',
  'linkedProductId',
  'relationId',
] as const

export type RecipeIngredientSourceOfTruthViolation = {
  code: 'DUPLICATE_LINKED_PRODUCT_IN_JSON'
  productPublicationId: string
}

export class RecipeIngredientSourceOfTruthError extends Error {
  constructor(
    message: string,
    readonly violation?: RecipeIngredientSourceOfTruthViolation,
  ) {
    super(message)
    this.name = 'RecipeIngredientSourceOfTruthError'
  }
}

function ingredientRows(attributesJson: Record<string, unknown>): unknown[] {
  const raw = attributesJson.ingredients
  return Array.isArray(raw) ? raw : []
}

function productIdFromJsonRow(row: Record<string, unknown>): string | null {
  for (const key of LINKED_PRODUCT_JSON_KEYS) {
    const value = row[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }
  return null
}

/**
 * Ensures no linked product appears in both graph and JSON.
 * Graph is authoritative for purchasable / linked products.
 */
export function assertRecipeIngredientSourceOfTruth(params: {
  attributesJson: Record<string, unknown>
  linkedProductPublicationIds: Iterable<string>
}): void {
  const linkedIds = new Set(params.linkedProductPublicationIds)

  for (const row of ingredientRows(params.attributesJson)) {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) continue
    const record = row as Record<string, unknown>
    const jsonProductId = productIdFromJsonRow(record)
    if (jsonProductId && linkedIds.has(jsonProductId)) {
      throw new RecipeIngredientSourceOfTruthError(
        `Linked product ${jsonProductId} must not appear in attributes_json.ingredients; use uses graph edges only.`,
        { code: 'DUPLICATE_LINKED_PRODUCT_IN_JSON', productPublicationId: jsonProductId },
      )
    }
  }
}

/** Returns product publication ids referenced from JSON (legacy / invalid for linked products). */
export function linkedProductIdsInJson(attributesJson: Record<string, unknown>): string[] {
  const ids: string[] = []
  for (const row of ingredientRows(attributesJson)) {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) continue
    const jsonProductId = productIdFromJsonRow(row as Record<string, unknown>)
    if (jsonProductId) ids.push(jsonProductId)
  }
  return ids
}
