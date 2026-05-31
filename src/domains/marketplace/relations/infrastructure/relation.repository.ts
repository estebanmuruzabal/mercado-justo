import { createClient } from '@/shared/database/supabase/server'
import type { PublicationRelation } from '../domain/entities/publication-relation'
import type { RelationType } from '@/domains/marketplace/shared/domain/relation-type-registry'

function mapRow(row: Record<string, unknown>): PublicationRelation {
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
  }
}

export async function listRelationsFromSource(
  sourcePublicationId: string,
): Promise<PublicationRelation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('publication_relation')
    .select(
      'id, source_publication_id, target_publication_id, relation_type, metadata_json, visibility, valid_from, valid_to, created_by',
    )
    .eq('source_publication_id', sourcePublicationId)

  if (error) throw error
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
}

export async function listRelationsToTarget(
  targetPublicationId: string,
): Promise<PublicationRelation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('publication_relation')
    .select(
      'id, source_publication_id, target_publication_id, relation_type, metadata_json, visibility, valid_from, valid_to, created_by',
    )
    .eq('target_publication_id', targetPublicationId)

  if (error) throw error
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
}
