import {
  RELATION_TYPE_REGISTRY,
  RELATION_TYPES,
  type RelationType,
} from './relation-type-registry'

/** Must match Postgres CHECK on publication_relation.relation_type */
export const DB_RELATION_TYPE_CHECK = [
  'uses',
  'hosted_at',
  'promotes',
  'maintains',
  'commercial_variant_of',
] as const

export function assertRelationRegistryIntegrity(): void {
  const codes = new Set<string>()

  for (const type of RELATION_TYPES) {
    if (codes.has(type)) {
      throw new Error(`Duplicate relation type in registry: ${type}`)
    }
    codes.add(type)

    const def = RELATION_TYPE_REGISTRY[type as RelationType]
    if (def.allowedSourceTypes.length === 0) {
      throw new Error(`allowedSourceTypes empty for ${type}`)
    }
    if (def.allowedTargetTypes.length === 0) {
      throw new Error(`allowedTargetTypes empty for ${type}`)
    }
    if (!def.queryInverseBy) {
      throw new Error(`queryInverseBy missing for ${type}`)
    }
    if (def.inverseLabel !== undefined && def.inverseLabel.trim().length === 0) {
      throw new Error(`inverseLabel incoherent for ${type}`)
    }
    if (type === 'commercial_variant_of' && def.deprecated !== true) {
      throw new Error('commercial_variant_of must be marked deprecated (ADR-R3-003)')
    }
  }

  for (const dbType of DB_RELATION_TYPE_CHECK) {
    if (!codes.has(dbType)) {
      throw new Error(`Registry missing DB CHECK type: ${dbType}`)
    }
  }
}
