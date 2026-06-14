import { redirect } from 'next/navigation'

import { CheckoutClient } from '@/domains/marketplace/checkout/presentation/components/checkout-client'
import { getCheckoutSignInUrl } from '@/domains/auth/domain/auth/checkout'
import { createClient } from '@/shared/database/supabase/server'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(getCheckoutSignInUrl())
  }

  return <CheckoutClient />
}

