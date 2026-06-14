import { SIGN_IN_PATH } from '@/shared/routing/routes'
import { createClient } from '@/shared/database/supabase/server'
import { redirect } from 'next/navigation'

import { ProfilePageClient } from '@/domains/users/presentation/profile/profile-page-client'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(SIGN_IN_PATH)
  }

  const [store, role] = await Promise.all([
    getStoreByUserId(user.id),
    getUserRoleByUserId(user.id),
  ])
  return (
    <ProfilePageClient
      userEmail={user?.email ?? ''}
      initialStore={store}
      initialRole={role}
    />
  )
}