import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getStoreByUserId } from '@/server/services/store.service'
import { SellerModePageClient } from '@/components/profile/seller-mode-page-client'

export default async function SellerModePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const store = await getStoreByUserId(user.id)

  return <SellerModePageClient initialStore={store} />
}

