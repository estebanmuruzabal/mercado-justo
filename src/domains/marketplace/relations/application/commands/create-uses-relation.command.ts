/**
 * R5.2 internal command — links a protocol input (recipe) to a product via `uses`.
 * Product-only target shim (R5.3); USABLE expansion and Grower auth wire in R5.4+.
 */
import {
  canCreateUsesRelation,
  type RelationWriteActor,
} from '../auth/relation-write-authorization.service'
import { assertUsesRelationWrite } from '../../domain/policies/uses-write-policy'
import {
  existsUsesRelation,
  insertUsesRelation,
  loadPublicationTypesAndOwner,
} from '../../infrastructure/relation.repository'

export type CreateUsesRelationInput = {
  sourceRecipePublicationId: string
  targetProductPublicationId: string
  metadata?: Record<string, unknown>
  actor: RelationWriteActor
}

export class CreateUsesRelationError extends Error {
  constructor(
    message: string,
    readonly code: 'FORBIDDEN' | 'NOT_FOUND' | 'INVARIANT',
  ) {
    super(message)
    this.name = 'CreateUsesRelationError'
  }
}

/**
 * R5.2 — Create-only MVP for recipe → product uses edges.
 * Internal command — not exported from relations/index.ts (C5).
 */
export async function createUsesRelation(
  input: CreateUsesRelationInput,
): Promise<{ relationId: string }> {
  const [source, target] = await Promise.all([
    loadPublicationTypesAndOwner(input.sourceRecipePublicationId),
    loadPublicationTypesAndOwner(input.targetProductPublicationId),
  ])

  if (!source || !target) {
    throw new CreateUsesRelationError(
      'Source recipe or target product publication not found.',
      'NOT_FOUND',
    )
  }

  if (
    !canCreateUsesRelation(input.actor, {
      ownerType: source.ownerType,
      ownerId: source.ownerId,
    })
  ) {
    throw new CreateUsesRelationError(
      'Actor is not authorized to create uses relations for this recipe.',
      'FORBIDDEN',
    )
  }

  const alreadyExists = await existsUsesRelation(
    input.sourceRecipePublicationId,
    input.targetProductPublicationId,
  )

  try {
    assertUsesRelationWrite({
      sourcePublicationId: input.sourceRecipePublicationId,
      targetPublicationId: input.targetProductPublicationId,
      sourcePublicationType: source.publicationType,
      targetPublicationType: target.publicationType,
      alreadyExists,
    })
  } catch (err) {
    throw new CreateUsesRelationError(
      err instanceof Error ? err.message : 'Uses relation invariant violated.',
      'INVARIANT',
    )
  }

  const relation = await insertUsesRelation({
    sourcePublicationId: input.sourceRecipePublicationId,
    targetPublicationId: input.targetProductPublicationId,
    metadata: input.metadata,
    createdBy: input.actor.serviceRole ? null : input.actor.userId,
  })

  return { relationId: relation.id }
}
