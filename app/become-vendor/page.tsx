import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BecomeVendorForm } from '@/components/become-vendor/become-vendor-form'
import { createClient } from '@/lib/supabase/server'
import { BECOME_VENDOR_PATH, HOME_PATH, VENDOR_INFORMATION_PATH, signInPathWithCallback } from '@/lib/routes'
import { getStoreByUserId } from '@/server/services/store.service'

export default async function BecomeVendorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(signInPathWithCallback(BECOME_VENDOR_PATH))
  }

  const store = await getStoreByUserId(user.id)
  if (store) {
    redirect(VENDOR_INFORMATION_PATH)
  }

  return (
    <main className='min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10'>
      <div className='mx-auto max-w-3xl space-y-6'>
        <Link href={HOME_PATH} className='text-sm text-muted-foreground hover:text-foreground'>
          ← Volver al inicio
        </Link>
        <BecomeVendorForm userId={user.id} />
      </div>
    </main>
  )
}
