import type {
  RelationSnapshot,
  ResolveRelationSnapshotsOptions,
} from '../dto/relation-snapshot.dto'
import { mapRelationReadRowToSnapshot } from '../mappers/relation-snapshot.mapper'
import {
  canBypassPublicRelationFilter,
  isPublicRelationEdge,
} from '../../domain/policies/relation-policy'
import { findRelationsByPublicationIds } from '../../infrastructure/relation.repository'

function normalizeOptions(
  options: ResolveRelationSnapshotsOptions = {},
): Required<Pick<ResolveRelationSnapshotsOptions, 'direction' | 'includePrivate'>> &
  ResolveRelationSnapshotsOptions {
  const depth = options.depth ?? 1
  if (depth > 1 && process.env.NODE_ENV !== 'production') {
    console.warn('[relations] depth > 1 is reserved for R3.4; clamping to 1')
  }

  return {
    ...options,
    direction: options.direction ?? 'outgoing',
    includePrivate: options.includePrivate ?? false,
    depth: 1,
  }
}

/**
 * Canonical read API for the publication relation graph.
 *
 * Public reads filter to active + visible edges (B4/C2).
 * `includePrivate` extends visibility for authorized actors only (source owner, admin, serviceRole).
 * Without `actor`, `includePrivate` is ignored and public filtering applies.
 *
 * R3.0: private DB edges are not returned by current RLS — see ResolveRelationSnapshotsOptions JSDoc.
 * TODO(R3.1): Private relations become fully accessible only after owner-aware RLS policies.
 */
export async function resolveRelationSnapshots(
  publicationIds: string[],
  options: ResolveRelationSnapshotsOptions = {},
): Promise<Map<string, RelationSnapshot[]>> {
  const normalized = normalizeOptions(options)
  const uniqueIds = [...new Set(publicationIds)]
  const result = new Map<string, RelationSnapshot[]>()

  for (const id of uniqueIds) {
    result.set(id, [])
  }

  if (uniqueIds.length === 0) {
    return result
  }

  const mayIncludePrivate = normalized.includePrivate && normalized.actor !== undefined

  const rows = await findRelationsByPublicationIds(uniqueIds, {
    direction: normalized.direction,
    relationTypes: normalized.relationTypes,
  })

  for (const row of rows) {
    const isPublic = isPublicRelationEdge(
      row.relation,
      row.sourcePublication,
      row.targetPublication,
    )

    const canBypass =
      mayIncludePrivate &&
      canBypassPublicRelationFilter(normalized.actor, {
        ownerType: row.sourcePublication.ownerType,
        ownerId: row.sourcePublication.ownerId,
      })

    if (!isPublic && !canBypass) {
      continue
    }

    const snapshot = mapRelationReadRowToSnapshot(row)
    const list = result.get(row.anchorPublicationId) ?? []
    list.push(snapshot)
    result.set(row.anchorPublicationId, list)
  }

  return result
}
