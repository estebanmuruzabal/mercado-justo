/**
 * @deprecated Use structural-role.ts and relations/domain/registry/relation-type-registry.ts instead.
 * Remove after Offer subdomain stabilization (checkout still on listing_variant).
 * Target removal: 2026-12-31 (Q4 2026).
 * Tracking: grep "publication-kind" — must be zero imports before delete.
 */
export {
  STRUCTURAL_ROLES,
  type StructuralRole,
  structuralRoleFromLegacyKind,
  isRootPublication,
} from './structural-role'

/** @deprecated Use StructuralRole */
export const PUBLICATION_KINDS = ['base', 'variant', 'recipe', 'instance'] as const

/** @deprecated Use StructuralRole */
export type PublicationKind = (typeof PUBLICATION_KINDS)[number]

export const COMPOSITION_TYPES = ['base_variant', 'base_recipe', 'derived'] as const

export type CompositionType = (typeof COMPOSITION_TYPES)[number]

/** @deprecated Migrated to RelationTypeRegistry */
export function compositionTypeForLegacyKind(kind: string): CompositionType {
  if (kind === 'variant') return 'base_variant'
  if (kind === 'recipe') return 'base_recipe'
  return 'derived'
}
