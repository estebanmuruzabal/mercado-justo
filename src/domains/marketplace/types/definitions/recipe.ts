export const RECIPE_TYPE_DEFINITION = {
  code: 'recipe',
  schemaVersion: 1,
  requiredAttributes: ['ingredients', 'steps', 'servings'],
} as const
