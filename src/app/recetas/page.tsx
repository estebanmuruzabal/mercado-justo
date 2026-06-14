import { redirect } from 'next/navigation'

import { createClient } from '@/shared/database/supabase/server'
import { isGrowerMember } from '@/domains/dittobots/domain/grower-capability'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'
import { isSuperAdmin } from '@/domains/users/domain/roles'
import { listRecipeProtocolsForUser } from '@/domains/marketplace/publication/application/queries/recipe-protocol.queries'
import { canCreateProtocol } from '@/domains/marketplace/publication/application/policies/recipe-protocol-policy'
import { RecetasPageClient } from '@/domains/marketplace/publication/presentation/recetas/recetas-page-client'
import { PROFILE_DITTOBOTS_PATH, SIGN_IN_PATH } from '@/shared/routing/routes'

export const dynamic = 'force-dynamic'

export default async function RecetasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(SIGN_IN_PATH)
  }

  const role = await getUserRoleByUserId(user.id)
  const grower = await isGrowerMember(user.id)

  if (!grower && !isSuperAdmin(role)) {
    redirect(PROFILE_DITTOBOTS_PATH)
  }

  const protocols = await listRecipeProtocolsForUser(user.id)
  const canCreate = canCreateProtocol({ userId: user.id, role, isGrowerMember: grower })

  return <RecetasPageClient protocols={protocols} canCreate={canCreate} />
}
