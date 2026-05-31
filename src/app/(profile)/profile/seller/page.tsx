import { redirect } from 'next/navigation'

import { createClient } from '@/shared/database/supabase/server'
import { BECOME_VENDOR_PATH, SIGN_IN_PATH, VENDOR_INFORMATION_PATH } from '@/shared/routing/routes'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'

export default async function ProfileSellerRedirectPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(SIGN_IN_PATH)

  const store = await getStoreByUserId(user.id)
  redirect(store ? VENDOR_INFORMATION_PATH : BECOME_VENDOR_PATH)
}
