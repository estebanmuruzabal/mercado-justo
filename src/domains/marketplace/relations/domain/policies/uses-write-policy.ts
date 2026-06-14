import { assertNotSelfRelation } from './relation-policy'
import { isAllowedRelation } from '../registry/relation-type-registry'

export const USES_RELATION_TYPE = 'uses' as const

/**
 * R5.2 MVP: protocol (recipe) → **product** only — temporary shim until R5.4 USABLE targets.
 * R5.3 documents transition; do not expand pairing here. Grower auth wire deferred (recipe-protocol-policy).
 */

/** Relation types rejected by R5.2 MVP write surface. */
export const MVP_BLOCKED_WRITE_RELATION_TYPES = [
  'commercial_variant_of',
  'hosted_at',
  'promotes',
  'maintains',
] as const

export type UsesRelationWriteErrorCode =
  | 'WRONG_RELATION_TYPE'
  | 'BLOCKED_RELATION_TYPE'
  | 'SELF_RELATION'
  | 'INVALID_TYPE_PAIRING'
  | 'DUPLICATE_RELATION'

export class UsesRelationWriteError extends Error {
  constructor(
    message: string,
    readonly code: UsesRelationWriteErrorCode,
  ) {
    super(message)
    this.name = 'UsesRelationWriteError'
  }
}

export function assertMvpWriteRelationType(relationType: string): void {
  if (relationType === USES_RELATION_TYPE) return

  if ((MVP_BLOCKED_WRITE_RELATION_TYPES as readonly string[]).includes(relationType)) {
    throw new UsesRelationWriteError(
      `Relation type "${relationType}" is not writable in R5.2 MVP.`,
      'BLOCKED_RELATION_TYPE',
    )
  }

  throw new UsesRelationWriteError(
    `Relation type "${relationType}" is not allowed; MVP supports "uses" only.`,
    'WRONG_RELATION_TYPE',
  )
}

export function assertUsesRelationWrite(params: {
  sourcePublicationId: string
  targetPublicationId: string
  sourcePublicationType: string
  targetPublicationType: string
  relationType?: string
  alreadyExists?: boolean
}): void {
  const relationType = params.relationType ?? USES_RELATION_TYPE
  assertMvpWriteRelationType(relationType)

  try {
    assertNotSelfRelation(params.sourcePublicationId, params.targetPublicationId)
  } catch {
    throw new UsesRelationWriteError('Self-relations are not allowed for uses edges.', 'SELF_RELATION')
  }

  if (!isAllowedRelation(USES_RELATION_TYPE, params.sourcePublicationType, params.targetPublicationType)) {
    throw new UsesRelationWriteError(
      `Invalid uses pairing: ${params.sourcePublicationType} → ${params.targetPublicationType}. Expected recipe → product.`,
      'INVALID_TYPE_PAIRING',
    )
  }

  if (params.alreadyExists) {
    throw new UsesRelationWriteError(
      'A uses relation already exists for this recipe and product.',
      'DUPLICATE_RELATION',
    )
  }
}
