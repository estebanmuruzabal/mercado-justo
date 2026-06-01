'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/shared/database/supabase/server'
import { isGrowerMember } from '@/domains/dittobots/domain/grower-capability'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'
import { userOwner } from '@/domains/marketplace/publication/domain/value-objects/owner-ref'
import { RECETAS_PATH } from '@/shared/routing/routes'
import {
  canViewProtocol,
  type ProtocolPublicationView,
} from '../policies/recipe-protocol-policy'

export type RateRecipeProtocolResult = { success: true } | { success: false; error: string }

const rateSchema = z.object({
  publicationId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional(),
})

export async function rateRecipeProtocolAction(
  input: z.input<typeof rateSchema>,
): Promise<RateRecipeProtocolResult> {
  const parsed = rateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Debés iniciar sesión.' }
  }

  const role = await getUserRoleByUserId(user.id)
  const grower = await isGrowerMember(user.id)

  const { data: pubRow, error: pubError } = await supabase
    .from('publication')
    .select('publication_type, owner_type, owner_id, lifecycle_state, moderation_status, visibility')
    .eq('id', parsed.data.publicationId)
    .maybeSingle()

  if (pubError || !pubRow) {
    return { success: false, error: 'Protocolo no encontrado.' }
  }

  const row = pubRow as {
    publication_type: string
    owner_type: string
    owner_id: string
    lifecycle_state: string
    moderation_status: string
    visibility: string
  }

  const view: ProtocolPublicationView = {
    publicationType: row.publication_type,
    owner: userOwner(row.owner_id),
    lifecycle: row.lifecycle_state as ProtocolPublicationView['lifecycle'],
    moderationStatus: row.moderation_status,
    visibility: row.visibility as ProtocolPublicationView['visibility'],
  }

  if (!canViewProtocol({ userId: user.id, role, isGrowerMember: grower }, view)) {
    return { success: false, error: 'No podés calificar este protocolo.' }
  }

  const { error } = await supabase.from('publication_review').upsert(
    {
      publication_id: parsed.data.publicationId,
      author_id: user.id,
      rating: parsed.data.rating,
      body: parsed.data.body ?? null,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: 'publication_id,author_id' },
  )

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(RECETAS_PATH)
  return { success: true }
}
