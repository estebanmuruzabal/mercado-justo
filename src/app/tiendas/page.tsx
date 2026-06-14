import Link from 'next/link'

import { StaticPageShell } from '@/shared/shell/layout/static-page-shell'
import { publicVendorPath } from '@/shared/routing/routes'
import { fetchPublicStores } from '@/domains/marketplace/discovery'

export const metadata = {
  title: 'Tiendas',
  description: 'Explorá las tiendas activas en Mercado Justo.',
}

export default async function StoresPage() {
  const stores = await fetchPublicStores()

  return (
    <StaticPageShell
      title='Tiendas'
      description='Descubrí vendedores locales con productos publicados en la plataforma.'
    >
      {stores.length === 0 ? (
        <p className='text-muted-foreground'>Todavía no hay tiendas activas para mostrar.</p>
      ) : (
        <ul className='grid gap-4 sm:grid-cols-2'>
          {stores.map((store) => (
            <li key={store.id}>
              <Link
                href={publicVendorPath(store.slug)}
                className='block rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40'
              >
                <p className='font-medium'>{store.name}</p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {store.reviewCount > 0
                    ? `${store.ratingAvg.toFixed(1)} · ${store.reviewCount} reseña${store.reviewCount === 1 ? '' : 's'}`
                    : 'Sin reseñas todavía'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </StaticPageShell>
  )
}
