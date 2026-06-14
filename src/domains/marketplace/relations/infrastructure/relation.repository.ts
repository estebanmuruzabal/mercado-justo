import { createClient } from '@/shared/database/supabase/server'
import type { PublicationRelation } from '../domain/entities/publication-relation'
import {
  compareRelationsDeterministic,
  type PublicationVisibilityContext,
} from '../domain/policies/relation-policy'
import type { RelationType } from '../domain/registry/relation-type-registry'

const RELATION_SELECT =
  'id, source_publication_id, target_publication_id, relation_type, metadata_json, visibility, valid_from, valid_to, created_by, created_at'

const PUBLICATION_SELECT =
  'id, title, publication_type, visibility, lifecycle_state, attributes_json, owner_type, owner_id'

type PublicationContextFields = PublicationVisibilityContext & {
  ownerType: string
  ownerId: string
}

export type RelationReadRow = {
  relation: PublicationRelation
  sourcePublication: PublicationContextFields & {
    id: string
    title: string | null
    publicationType: string
    attributes: Record<string, unknown>
  }
  targetPublication: PublicationContextFields & {
    id: string
    title: string | null
    publicationType: string
    attributes: Record<string, unknown>
  }
  anchorPublicationId: string
  direction: 'outgoing' | 'incoming'
}

type PublicationRow = {
  id: string
  title: string | null
  publication_type: string
  visibility: string
  lifecycle_state: string
  attributes_json: Record<string, unknown> | null
  owner_type: string
  owner_id: string
}

type RelationQueryRow = Record<string, unknown> & {
  source: PublicationRow
  target: PublicationRow
}

function mapPublication(row: PublicationRow) {
  return {
    id: row.id,
    title: row.title,
    publicationType: row.publication_type,
    visibility: row.visibility,
    lifecycleState: row.lifecycle_state,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    attributes: (row.attributes_json as Record<string, unknown>) ?? {},
  }
}

function mapRelationRow(row: Record<string, unknown>): PublicationRelation {
  return {
    id: row.id as string,
    sourcePublicationId: row.source_publication_id as string,
    targetPublicationId: row.target_publication_id as string,
    relationType: row.relation_type as RelationType,
    metadata: (row.metadata_json as Record<string, unknown>) ?? {},
    visibility: row.visibility as PublicationRelation['visibility'],
    validFrom: row.valid_from as string | null,
    validTo: row.valid_to as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    /** R3.2 (B3): map from DB is_active column when migration lands. */
    isActive: true,
  }
}

function mapJoinedRow(
  row: RelationQueryRow,
  anchorPublicationId: string,
  direction: 'outgoing' | 'incoming',
): RelationReadRow {
  const relation = mapRelationRow(row)
  const sourcePublication = mapPublication(row.source)
  const targetPublication = mapPublication(row.target)

  return {
    relation,
    sourcePublication,
    targetPublication,
    anchorPublicationId,
    direction,
  }
}

function sortReadRows(rows: RelationReadRow[]): RelationReadRow[] {
  return [...rows].sort((a, b) => compareRelationsDeterministic(a.relation, b.relation))
}

/** @internal */
export async function findOutgoingRelations(
  publicationIds: string[],
  relationTypes?: RelationType[],
): Promise<RelationReadRow[]> {
  if (publicationIds.length === 0) return []

  const supabase = await createClient()
  let query = supabase
    .from('publication_relation')
    .select(`${RELATION_SELECT}, source:publication!publication_relation_source_publication_id_fkey(${PUBLICATION_SELECT}), target:publication!publication_relation_target_publication_id_fkey(${PUBLICATION_SELECT})`)
    .in('source_publication_id', publicationIds)

  if (relationTypes && relationTypes.length > 0) {
    query = query.in('relation_type', relationTypes)
  }

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as RelationQueryRow[]
  return sortReadRows(
    rows.map((row) => mapJoinedRow(row, row.source_publication_id as string, 'outgoing')),
  )
}

/** @internal */
export async function findIncomingRelations(
  publicationIds: string[],
  relationTypes?: RelationType[],
): Promise<RelationReadRow[]> {
  if (publicationIds.length === 0) return []

  const supabase = await createClient()
  let query = supabase
    .from('publication_relation')
    .select(`${RELATION_SELECT}, source:publication!publication_relation_source_publication_id_fkey(${PUBLICATION_SELECT}), target:publication!publication_relation_target_publication_id_fkey(${PUBLICATION_SELECT})`)
    .in('target_publication_id', publicationIds)

  if (relationTypes && relationTypes.length > 0) {
    query = query.in('relation_type', relationTypes)
  }

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as RelationQueryRow[]
  return sortReadRows(
    rows.map((row) => mapJoinedRow(row, row.target_publication_id as string, 'incoming')),
  )
}

/** @internal */
export async function findRelationsByPublicationIds(
  publicationIds: string[],
  options: {
    direction?: 'outgoing' | 'incoming' | 'both'
    relationTypes?: RelationType[]
  } = {},
): Promise<RelationReadRow[]> {
  const direction = options.direction ?? 'outgoing'
  const uniqueIds = [...new Set(publicationIds)]
  const byRelationId = new Map<string, RelationReadRow>()

  if (direction === 'outgoing' || direction === 'both') {
    for (const row of await findOutgoingRelations(uniqueIds, options.relationTypes)) {
      byRelationId.set(row.relation.id, row)
    }
  }

  if (direction === 'incoming' || direction === 'both') {
    for (const row of await findIncomingRelations(uniqueIds, options.relationTypes)) {
      byRelationId.set(row.relation.id, row)
    }
  }

  return sortReadRows([...byRelationId.values()])
}

export type PublicationTypesAndOwner = {
  id: string
  publicationType: string
  ownerType: string
  ownerId: string
}

/** @internal — R5.2 create path only */
export async function loadPublicationTypesAndOwner(
  id: string,
): Promise<PublicationTypesAndOwner | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('publication')
    .select('id, publication_type, owner_type, owner_id')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as Record<string, unknown>
  return {
    id: row.id as string,
    publicationType: row.publication_type as string,
    ownerType: row.owner_type as string,
    ownerId: row.owner_id as string,
  }
}

/** @internal — R5.2 create path only */
export async function existsUsesRelation(
  sourcePublicationId: string,
  targetPublicationId: string,
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('publication_relation')
    .select('id')
    .eq('source_publication_id', sourcePublicationId)
    .eq('target_publication_id', targetPublicationId)
    .eq('relation_type', 'uses')
    .maybeSingle()

  if (error) throw error
  return data !== null
}

/** @internal — R5.2 create path only */
export async function insertUsesRelation(params: {
  sourcePublicationId: string
  targetPublicationId: string
  metadata?: Record<string, unknown>
  createdBy?: string | null
}): Promise<PublicationRelation> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('publication_relation')
    .insert({
      source_publication_id: params.sourcePublicationId,
      target_publication_id: params.targetPublicationId,
      relation_type: 'uses',
      metadata_json: params.metadata ?? {},
      created_by: params.createdBy ?? null,
    } as never)
    .select(RELATION_SELECT)
    .single()

  if (error) throw error
  return mapRelationRow(data as Record<string, unknown>)
}
