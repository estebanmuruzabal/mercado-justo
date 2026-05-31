/**
 * @deprecated Strangler re-export — migrate consumers off this path.
 * TODO(R3.3): migrate publication-composition.ts (needs relationTypeFromLegacyComposition).
 * TODO(R4.0): remove this re-export once all consumers migrate.
 *
 * Active consumers (outside Relations BC — do not remove until migrated):
 * - src/domains/marketplace/publication/domain/entities/publication-composition.ts
 *   imports: RelationType, relationTypeFromLegacyComposition
 * - test/domains/marketplace/discovery/discovery-evolution.test.ts
 *   imports: isAllowedRelation, relationTypeFromLegacyComposition
 *
 * Verified canonical paths (Relations BC):
 * - Registry source module:
 *   @/domains/marketplace/relations/domain/registry/relation-type-registry
 * - Public type-only boundary (RelationType only, no helpers):
 *   import type { RelationType } from '@/domains/marketplace/relations'
 *   (export type in relations/index.ts — helpers NOT on public boundary)
 */
export * from '@/domains/marketplace/relations/domain/registry/relation-type-registry'
