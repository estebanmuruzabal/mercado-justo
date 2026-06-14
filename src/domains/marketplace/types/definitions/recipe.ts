/**
 * Ditto Protocol (publication_type `recipe`) — cultivation / automation procedures
 * executable by DittoBots within the Ditto Grower network.
 *
 * **Not** gastronomic content. DB attribute keys remain legacy until a v2 schema lands:
 *
 * | Legacy (DB v1) | Protocol v2 (planned) |
 * |----------------|----------------------|
 * | `ingredients`  | `inputs`             |
 * | `steps`        | `steps` (execution)  |
 * | `servings`     | `executionContext`   |
 *
 * Linked protocol inputs: graph `uses` edges (R5.2 product-only shim → USABLE in R5.4).
 * Free inputs: `attributes_json.ingredients[]` until graph migration completes.
 *
 * Ownership: `owner_type = 'user'` (author) — never store/seller. See `recipe-protocol-policy.ts`.
 * Discovery: exclude `recipe` from public feed; community library is Grower-scoped (R5.3).
 */
export const RECIPE_TYPE_DEFINITION = {
  code: 'recipe',
  schemaVersion: 1,
  requiredAttributes: ['ingredients', 'steps', 'servings'],
} as const
