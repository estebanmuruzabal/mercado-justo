import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  const supabase = await createClient()

  const { data: storeRow, error: storeError } = await supabase
    .from('store')
    .select('id,name,address,mode,plan,product_limit,created_at')
    .eq('id', storeId)
    .maybeSingle()

  if (storeError) throw storeError

  if (!storeRow) {
    return (
      <main className='min-h-screen bg-background px-6 py-10'>
        <div className='mx-auto max-w-3xl space-y-6'>
          <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
            ← Back to home
          </Link>
          <div className='space-y-2'>
            <h1 className='text-3xl font-bold'>Vendedor no encontrado</h1>
            <p className='text-muted-foreground'>Puede que el comercio ya no esté disponible.</p>
          </div>
        </div>
      </main>
    )
  }

  type StoreRow = {
    id: string
    name: string
    address: string | null
    mode: string
    plan: string
    product_limit: number
    created_at: string
  }

  const typedStore = storeRow as StoreRow

  return (
    <main className='min-h-screen bg-background px-6 py-10'>
      <div className='mx-auto max-w-4xl space-y-6'>
        <div>
          <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
            ← Back to home
          </Link>
        </div>

        <div className='space-y-1'>
          <h1 className='text-3xl font-bold'>{typedStore.name}</h1>
          <p className='text-sm text-muted-foreground'>
            {typedStore.mode} • Plan {typedStore.plan} • Límite: {typedStore.product_limit} productos
          </p>
          {typedStore.address ? <p className='text-sm text-muted-foreground'>{typedStore.address}</p> : null}
        </div>

        <div className='rounded-xl border bg-muted/10 p-4'>
          <p className='text-sm text-muted-foreground'>
            Próximamente: catálogo del vendedor y reseñas. Por ahora podés ver el detalle de productos desde la
            homepage.
          </p>
        </div>
      </div>
    </main>
  )
}

