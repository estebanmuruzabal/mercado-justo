'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/shared/database/supabase/server'
import { isGrowerMember } from '@/domains/dittobots/domain/grower-capability'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'
import { RECETAS_PATH } from '@/shared/routing/routes'
import { createUsesRelation } from '@/domains/marketplace/relations/application/commands/create-uses-relation.command'
import {
  canCreateProtocol,
  type ProtocolPolicyActor,
} from '../policies/recipe-protocol-policy'
import { getProtocolTaxonomyNodeId } from '../queries/recipe-protocol.queries'

export type RecipeProtocolActionResult =
  | { success: true; publicationId: string }
  | { success: false; error: string }

const createSchema = z.object({
  title: z.string().trim().min(3, 'El título es obligatorio.').max(120),
  summary: z.string().trim().max(500).optional(),
  productPublicationId: z.string().uuid().optional(),
})

async function buildActor(userId: string): Promise<ProtocolPolicyActor> {
  const role = await getUserRoleByUserId(userId)
  const grower = await isGrowerMember(userId)
  return { userId, role, isGrowerMember: grower }
}

export async function createRecipeProtocolAction(
  input: z.input<typeof createSchema>,
): Promise<RecipeProtocolActionResult> {
  const parsed = createSchema.safeParse(input)
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

  const actor = await buildActor(user.id)
  if (!canCreateProtocol(actor)) {
    return { success: false, error: 'Necesitás un DittoBot activo para crear protocolos.' }
  }

  const taxonomyNodeId = await getProtocolTaxonomyNodeId()
  if (!taxonomyNodeId) {
    return { success: false, error: 'Taxonomía de protocolos no configurada.' }
  }

  try {
    const { data, error } = await supabase
      .from('publication')
      .insert({
        title: parsed.data.title,
        summary: parsed.data.summary ?? null,
        publication_type: 'recipe',
        taxonomy_node_id: taxonomyNodeId,
        owner_type: 'user',
        owner_id: user.id,
        lifecycle_state: 'draft',
        visibility: 'private',
        moderation_status: 'pending',
        attributes_json: {
          ingredients: [],
          steps: [],
          servings: 1,
        },
        structural_role: 'standalone',
        kind: 'recipe',
      } as never)
      .select('id')
      .single()

    if (error || !data) {
      return { success: false, error: error?.message ?? 'No se pudo crear el protocolo.' }
    }

    const publicationId = (data as { id: string }).id

    if (parsed.data.productPublicationId) {
      await createUsesRelation({
        sourceRecipePublicationId: publicationId,
        targetProductPublicationId: parsed.data.productPublicationId,
        actor: { userId: user.id, isAdmin: false, serviceRole: false },
      })
    }

    revalidatePath(RECETAS_PATH)
    return { success: true, publicationId }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear el protocolo.',
    }
  }
}
