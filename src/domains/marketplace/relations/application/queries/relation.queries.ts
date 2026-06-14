import type {
  RelationSnapshot,
  ResolveRelationSnapshotsOptions,
} from '../dto/relation-snapshot.dto'
import { shouldIncludeRelationEdge } from '../auth/relation-read-authorization.service'
import { mapRelationReadRowToSnapshot } from '../mappers/relation-snapshot.mapper'
import { isPublicRelationEdge } from '../../domain/policies/relation-policy'
import { findRelationsByPublicationIds } from '../../infrastructure/relation.repository'

function normalizeOptions(
  options: ResolveRelationSnapshotsOptions = {},
): Required<Pick<ResolveRelationSnapshotsOptions, 'direction' | 'includePrivate'>> &
  ResolveRelationSnapshotsOptions {
  const depth = options.depth ?? 1
  if (depth > 1 && process.env.NODE_ENV !== 'production') {
    console.warn('[relations] depth > 1 is reserved for a future release; clamping to 1')
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
 * R3.4: DB RLS returns private rows for source owners (publication_relation_select_private_source_owner)
 * and platform staff (publication_relation_select_staff). Application auth mirrors SQL (defense in depth).
 * serviceRole bypasses RLS only when using the Supabase service client — repository uses user JWT.
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

    if (
      !shouldIncludeRelationEdge({
        isPublic,
        includePrivate: normalized.includePrivate,
        actor: normalized.actor,
        sourceOwner: {
          ownerType: row.sourcePublication.ownerType,
          ownerId: row.sourcePublication.ownerId,
        },
      })
    ) {
      continue
    }

    const snapshot = mapRelationReadRowToSnapshot(row)
    const list = result.get(row.anchorPublicationId) ?? []
    list.push(snapshot)
    result.set(row.anchorPublicationId, list)
  }

  return result
}
