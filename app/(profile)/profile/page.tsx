import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { ProfilePageClient } from '@/components/profile/profile-page-client'
import { getStoreByUserId } from '@/server/services/store.service'
import { getUserRoleByUserId } from '@/server/queries/user.queries'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const store = await getStoreByUserId(user.id)
  const role = await getUserRoleByUserId(user.id)
  console.log(role)
  return (
    <ProfilePageClient
      userEmail={user?.email ?? ''}
      initialStore={store}
      initialRole={role}
    />
  )
}