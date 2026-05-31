import Link from 'next/link'

import { ProductDetailClient } from '@/domains/marketplace/listings/presentation/components/detail/ProductDetailClient'
import { createClient } from '@/shared/database/supabase/server'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingType: string; id: string }>
}) {
  const { listingType, id } = await params

  if (listingType !== 'product') {
    return (
      <main className='min-h-screen bg-background px-6 py-10'>
        <div className='mx-auto max-w-3xl space-y-6'>
          <div>
            <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
              ← Back to home
            </Link>
          </div>

          <div className='space-y-2'>
            <h1 className='text-3xl font-bold'>{listingType}</h1>
            <p className='text-muted-foreground'>Esta página de detalle todavía no está disponible para este tipo.</p>
          </div>
        </div>
      </main>
    )
  }

  const supabase = await createClient()

  const { data: listingRow, error: listingError } = await supabase
    .from('listing')
    .select('id,title,store_id,status,characteristics,latitude,longitude,store(name)')
    .eq('id', id)
    .eq('listing_type', listingType)
    .eq('status', 'published')
    .maybeSingle()

  if (listingError) throw listingError
  if (!listingRow) {
    return (
      <main className='min-h-screen bg-background px-6 py-10'>
        <div className='mx-auto max-w-3xl space-y-6'>
          <div>
            <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
              ← Back to home
            </Link>
          </div>

          <div className='space-y-2'>
            <h1 className='text-3xl font-bold'>Producto no encontrado</h1>
            <p className='text-muted-foreground'>Puede que ya no esté disponible.</p>
          </div>
        </div>
      </main>
    )
  }

  type ListingRow = {
    id: string
    title: string | null
    store_id: string
    latitude: number | null
    longitude: number | null
    store?: { name: string | null } | null
  }

  const listingTyped = listingRow as ListingRow
  const storeName = listingTyped.store?.name ?? 'Vendedor'

  const { data: variantRows, error: variantError } = await supabase
    .from('listing_variant')
    .select('id,name,sku,price,stock,is_default,attributes_json')
    .eq('listing_id', id)
    .order('is_default', { ascending: false })

  if (variantError) throw variantError

  type VariantRow = {
    id: string
    name?: string | null
    sku?: string | null
    price?: number | string | null
    stock?: number | null
    is_default?: boolean | null
    attributes_json?: Record<string, unknown> | null
  }

  const variants = (variantRows ?? []).map((v: VariantRow) => {
    const attrsRaw = v.attributes_json ?? {}
    const attributes: Record<string, string> = {}
    for (const [k, val] of Object.entries(attrsRaw)) {
      attributes[k] = typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' ? String(val) : JSON.stringify(val)
    }

    return {
      id: String(v.id),
      name: String(v.name ?? v.sku ?? 'Variante'),
      price: Number(v.price ?? 0),
      stock: Number(v.stock ?? 0),
      isDefault: Boolean(v.is_default),
      attributes,
    }
  })

  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0]

  const productImage =
    (defaultVariant?.attributes.image as string | undefined) ??
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop'

  const productTitle =
    (defaultVariant?.name && defaultVariant?.name !== 'Variante' ? defaultVariant.name : null) ?? listingTyped.title ?? 'Producto'

  return (
    <main className='min-h-screen bg-background px-6 py-10'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <div>
          <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
            ← Back to home
          </Link>
        </div>

        <ProductDetailClient
          storeId={String(listingTyped.store_id)}
          storeName={storeName ?? undefined}
          productTitle={productTitle}
          productImage={productImage}
          latitude={listingTyped.latitude === null ? null : Number(listingTyped.latitude)}
          longitude={listingTyped.longitude === null ? null : Number(listingTyped.longitude)}
          variants={variants}
        />
      </div>
    </main>
  )
}

