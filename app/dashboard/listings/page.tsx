import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { ListingManager } from '@/components/listings/ListingManager'
import { getStoreByUserId } from '@/server/services/store.service'

export default async function VendorListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  const store = await getStoreByUserId(user.id)

  if (!store) {
    return (
      <main className='min-h-screen bg-background px-6 py-10'>
        <div className='mx-auto max-w-3xl space-y-6'>
          <Link href='/profile' className='text-sm text-muted-foreground hover:text-foreground'>
            ← Volver al perfil
          </Link>
          <div className='space-y-2'>
            <h1 className='text-3xl font-bold'>Activá modo vendedor</h1>
            <p className='text-muted-foreground'>
              Tenés que activar tu tienda para poder gestionar tus listings.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-background px-6 py-10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <div className='flex items-center justify-between gap-4'>
          <div className='space-y-1'>
            <h1 className='text-3xl font-bold'>Vendor panel</h1>
            <p className='text-sm text-muted-foreground'>Gestioná tus listings</p>
          </div>
          <Link href='/profile' className='rounded-lg border bg-white px-4 py-2 text-sm hover:bg-neutral-50'>
            Ir a configuración
          </Link>
        </div>
        <ListingManager />
      </div>
    </main>
  )
}

