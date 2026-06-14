import { createClient } from '@/shared/database/supabase/server'
import type { Publication } from '../domain/entities/publication'
import {
  publicationFromListingRow,
  type ListingRowForPublication,
} from '../infrastructure/listing-adapter'

const PUBLICATION_SELECT = `
  id, title, description, listing_type, category_id, store_id,
  status, moderation_status, moderation_reason, characteristics,
  latitude, longitude, created_at
`

const PUBLICATION_TABLE_SELECT = `
  id, title, summary, body, publication_type, taxonomy_node_id, owner_type, owner_id,
  lifecycle_state, visibility, moderation_status, moderation_reason,
  attributes_json, latitude, longitude, structural_role, kind, parent_publication_id,
  taxonomy_path, view_count, follower_count, review_count, rating_avg,
  created_at, updated_at, published_at, archived_at, legacy_listing_id
`

function mapPublicationTableRow(row: Record<string, unknown>): Publication {
  return publicationFromListingRow({
    id: row.id as string,
    title: row.title as string | null,
    description: (row.body as string | null) ?? (row.summary as string | null),
    listing_type: row.publication_type as string,
    category_id: row.taxonomy_node_id as string,
    store_id: row.owner_type === 'store' ? (row.owner_id as string) : '',
    owner_type: row.owner_type as string,
    owner_id: row.owner_id as string,
    status: row.lifecycle_state === 'published' ? 'published' : 'draft',
    moderation_status: row.moderation_status as string,
    moderation_reason: row.moderation_reason as string | null,
    characteristics: (row.attributes_json as Record<string, unknown>) ?? {},
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    created_at: row.created_at as string,
    structural_role: row.structural_role as string | null,
    kind: row.kind as string | null,
    parent_publication_id: row.parent_publication_id as string | null,
    taxonomy_path: row.taxonomy_path as string | null,
    visibility: row.visibility as string | null,
    view_count: row.view_count as number | null,
    follower_count: row.follower_count as number | null,
    review_count: row.review_count as number | null,
    rating_avg: row.rating_avg as number | null,
    published_at: row.published_at as string | null,
    archived_at: row.archived_at as string | null,
    updated_at: row.updated_at as string | null,
  })
}

export async function getPublicationById(id: string): Promise<Publication | null> {
  const supabase = await createClient()

  const { data: pubRow, error: pubError } = await supabase
    .from('publication')
    .select(PUBLICATION_TABLE_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (!pubError && pubRow) {
    return mapPublicationTableRow(pubRow as Record<string, unknown>)
  }

  const { data: listingRow, error: listingError } = await supabase
    .from('listing')
    .select(PUBLICATION_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (listingError || !listingRow) return null
  return publicationFromListingRow(listingRow as ListingRowForPublication)
}

export async function listPublicationsByStore(storeId: string): Promise<Publication[]> {
  const supabase = await createClient()

  const { data: pubRows } = await supabase
    .from('publication')
    .select(PUBLICATION_TABLE_SELECT)
    .eq('owner_type', 'store')
    .eq('owner_id', storeId)
    .order('created_at', { ascending: false })

  if (pubRows && pubRows.length > 0) {
    return pubRows.map((row) => mapPublicationTableRow(row as Record<string, unknown>))
  }

  const { data: listingRows, error } = await supabase
    .from('listing')
    .select(PUBLICATION_SELECT)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (listingRows ?? []).map((row) =>
    publicationFromListingRow(row as ListingRowForPublication),
  )
}
