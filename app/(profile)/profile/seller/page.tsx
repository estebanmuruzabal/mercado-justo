import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { BECOME_VENDOR_PATH, SIGN_IN_PATH, VENDOR_SELLER_PATH } from '@/lib/routes'
import { getStoreByUserId } from '@/server/services/store.service'

export default async function ProfileSellerRedirectPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(SIGN_IN_PATH)

  const store = await getStoreByUserId(user.id)
  redirect(store ? VENDOR_SELLER_PATH : BECOME_VENDOR_PATH)
}
