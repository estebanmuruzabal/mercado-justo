import { SIGN_IN_PATH } from '@/lib/routes'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { ProfilePageClient } from '@/components/profile/profile-page-client'
import { getStoreByUserId } from '@/server/services/store.service'
import { getUserRoleByUserId } from '@/server/queries/user.queries'

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