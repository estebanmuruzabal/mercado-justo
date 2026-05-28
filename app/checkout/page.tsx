import { redirect } from 'next/navigation'

import { CheckoutClient } from '@/components/checkout/checkout-client'
import { getCheckoutSignInUrl } from '@/lib/auth/checkout'
import { createClient } from '@/lib/supabase/server'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(getCheckoutSignInUrl())
  }

  return <CheckoutClient />
}

