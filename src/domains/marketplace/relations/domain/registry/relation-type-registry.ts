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
  allowedSourceTypes: readonly string[]
  allowedTargetTypes: readonly string[]
  inverseLabel?: string
  queryInverseBy: 'target' | 'source'
  /** ADR-R3-003: legacy read-only types — write enforcement in R3.1. */
  deprecated?: boolean
}

export const RELATION_TYPE_REGISTRY: Record<RelationType, RelationTypeDefinition> = {
  uses: {
    code: 'uses',
    displayName: 'Usa',
    allowedSourceTypes: ['recipe'],
    allowedTargetTypes: ['product'],
    inverseLabel: 'used by',
    queryInverseBy: 'target',
  },
  hosted_at: {
    code: 'hosted_at',
    displayName: 'Ocurre en',
    allowedSourceTypes: ['event', 'experience'],
    allowedTargetTypes: ['property'],
    inverseLabel: 'hosts',
    queryInverseBy: 'target',
  },
  promotes: {
    code: 'promotes',
    displayName: 'Promociona',
    allowedSourceTypes: ['channel'],
    allowedTargetTypes: ['project', 'product', 'event'],
    inverseLabel: 'promoted by',
    queryInverseBy: 'target',
  },
  maintains: {
    code: 'maintains',
    displayName: 'Mantiene',
    allowedSourceTypes: ['service'],
    allowedTargetTypes: ['property'],
    inverseLabel: 'maintained by',
    queryInverseBy: 'target',
  },
  commercial_variant_of: {
    code: 'commercial_variant_of',
    displayName: 'Variante comercial de',
    allowedSourceTypes: ['product'],
    allowedTargetTypes: ['product'],
    inverseLabel: 'has variant',
    queryInverseBy: 'target',
    deprecated: true,
    // Canonical commercial variants live in Offer BC (ADR-R3-003).
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
