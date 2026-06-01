import { createClient } from '@/shared/database/supabase/server'
import { isGrowerMember } from '@/domains/dittobots/domain/grower-capability'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'
import { userOwner } from '@/domains/marketplace/publication/domain/value-objects/owner-ref'
import {
  canViewProtocol,
  isCommunityLibraryProtocol,
  type ProtocolPolicyActor,
  type ProtocolPublicationView,
} from '../policies/recipe-protocol-policy'

export type RecipeProtocolListItem = {
  id: string
  title: string | null
  summary: string | null
  lifecycle: string
  moderationStatus: string
  visibility: string
  ratingAvg: number
  reviewCount: number
  ownerUserId: string
  isOwn: boolean
  isLibrary: boolean
  createdAt: string
}

type PublicationRow = {
  id: string
  title: string | null
  summary: string | null
  publication_type: string
  owner_type: string
  owner_id: string
  lifecycle_state: string
  moderation_status: string
  visibility: string
  rating_avg: number | null
  review_count: number | null
  created_at: string
}

function toProtocolView(row: PublicationRow): ProtocolPublicationView {
  return {
    publicationType: row.publication_type,
    owner: userOwner(row.owner_id),
    lifecycle: row.lifecycle_state as ProtocolPublicationView['lifecycle'],
    moderationStatus: row.moderation_status,
    visibility: row.visibility as ProtocolPublicationView['visibility'],
  }
}

function mapListItem(row: PublicationRow, actor: ProtocolPolicyActor): RecipeProtocolListItem | null {
  const view = toProtocolView(row)
  if (!canViewProtocol(actor, view)) return null

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    lifecycle: row.lifecycle_state,
    moderationStatus: row.moderation_status,
    visibility: row.visibility,
    ratingAvg: Number(row.rating_avg ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    ownerUserId: row.owner_id,
    isOwn: row.owner_id === actor.userId,
    isLibrary: isCommunityLibraryProtocol(view),
    createdAt: row.created_at,
  }
}

async function buildActor(userId: string): Promise<ProtocolPolicyActor> {
  const role = await getUserRoleByUserId(userId)
  const grower = await isGrowerMember(userId)
  return { userId, role, isGrowerMember: grower }
}

export async function listRecipeProtocolsForUser(userId: string): Promise<RecipeProtocolListItem[]> {
  const actor = await buildActor(userId)
  const supabase = await createClient()

  const [ownResult, libraryResult] = await Promise.all([
    supabase
      .from('publication')
      .select(
        'id, title, summary, publication_type, owner_type, owner_id, lifecycle_state, moderation_status, visibility, rating_avg, review_count, created_at',
      )
      .eq('publication_type', 'recipe')
      .eq('owner_type', 'user')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('publication')
      .select(
        'id, title, summary, publication_type, owner_type, owner_id, lifecycle_state, moderation_status, visibility, rating_avg, review_count, created_at',
      )
      .eq('publication_type', 'recipe')
      .eq('lifecycle_state', 'published')
      .eq('moderation_status', 'approved')
      .eq('visibility', 'public')
      .neq('owner_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (ownResult.error) throw ownResult.error
  if (libraryResult.error) throw libraryResult.error

  const seen = new Set<string>()
  const items: RecipeProtocolListItem[] = []

  for (const row of [...(ownResult.data ?? []), ...(libraryResult.data ?? [])] as PublicationRow[]) {
    if (seen.has(row.id)) continue
    const mapped = mapListItem(row, actor)
    if (mapped) {
      seen.add(row.id)
      items.push(mapped)
    }
  }

  return items
}

export async function getProtocolTaxonomyNodeId(): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('taxonomy_node')
    .select('id')
    .eq('slug', 'protocolos')
    .maybeSingle()

  if (error) throw error
  return (data as { id: string } | null)?.id ?? null
}
