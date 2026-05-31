export const RELATION_TYPES = [
  'uses',
  'hosted_at',
  'promotes',
  'maintains',
  'commercial_variant_of',
] as const

export type RelationType = (typeof RELATION_TYPES)[number]

export type RelationTypeDefinition = {
  code: RelationType
  displayName: string
  /** Allowed source publication_type codes */
  allowedSourceTypes: readonly string[]
  /** Allowed target publication_type codes */
  allowedTargetTypes: readonly string[]
}

export const RELATION_TYPE_REGISTRY: Record<RelationType, RelationTypeDefinition> = {
  uses: {
    code: 'uses',
    displayName: 'Usa',
    allowedSourceTypes: ['recipe'],
    allowedTargetTypes: ['product'],
  },
  hosted_at: {
    code: 'hosted_at',
    displayName: 'Ocurre en',
    allowedSourceTypes: ['event', 'experience'],
    allowedTargetTypes: ['property'],
  },
  promotes: {
    code: 'promotes',
    displayName: 'Promociona',
    allowedSourceTypes: ['channel'],
    allowedTargetTypes: ['project', 'product', 'event'],
  },
  maintains: {
    code: 'maintains',
    displayName: 'Mantiene',
    allowedSourceTypes: ['service'],
    allowedTargetTypes: ['property'],
  },
  commercial_variant_of: {
    code: 'commercial_variant_of',
    displayName: 'Variante comercial de',
    allowedSourceTypes: ['product'],
    allowedTargetTypes: ['product'],
  },
}

export function isRelationType(value: string): value is RelationType {
  return (RELATION_TYPES as readonly string[]).includes(value)
}

export function getRelationTypeDefinition(code: string): RelationTypeDefinition | undefined {
  if (!isRelationType(code)) return undefined
  return RELATION_TYPE_REGISTRY[code]
}

export function isAllowedRelation(
  relationType: RelationType,
  sourcePublicationType: string,
  targetPublicationType: string,
): boolean {
  const def = RELATION_TYPE_REGISTRY[relationType]
  return (
    def.allowedSourceTypes.includes(sourcePublicationType) &&
    def.allowedTargetTypes.includes(targetPublicationType)
  )
}

/** Maps legacy publication_composition.composition_type to RelationType */
export function relationTypeFromLegacyComposition(compositionType: string): RelationType {
  switch (compositionType) {
    case 'base_variant':
      return 'commercial_variant_of'
    case 'base_recipe':
      return 'uses'
    default:
      return 'promotes'
  }
}
