/**
 * @deprecated Import RelationType and registry helpers from @/domains/marketplace/relations instead.
 * TODO(R3.2): remove shared registry re-export.
 *
 * Active consumers (migrate before R3.2):
 * - src/domains/marketplace/publication/domain/entities/publication-composition.ts
 * - test/domains/marketplace/discovery/discovery-evolution.test.ts
 */
export * from '@/domains/marketplace/relations/domain/registry/relation-type-registry'
