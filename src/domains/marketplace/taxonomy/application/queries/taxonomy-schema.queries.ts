import { createClient } from '@/shared/database/supabase/server'

export async function fetchTypeSchemaForPublication(
  publicationType: string,
  taxonomyNodeId?: string | null,
) {
  const supabase = await createClient()
  let query = supabase
    .from('publication_type_schema')
    .select('publication_type, taxonomy_node_id, schema_version, template_json')
    .eq('publication_type', publicationType)
    .order('schema_version', { ascending: false })
    .limit(1)

  if (taxonomyNodeId) {
    query = query.eq('taxonomy_node_id', taxonomyNodeId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) return null
  return data
}
