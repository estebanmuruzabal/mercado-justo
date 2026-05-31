import Link from 'next/link'

import { StaticPageShell } from '@/shared/shell/layout/static-page-shell'
import { HOME_PATH } from '@/shared/routing/routes'
import { fetchMarketplaceCategories } from '@/domains/marketplace/listings/application/queries/marketplace.queries'

export const metadata = {
  title: 'Categorías',
  description: 'Explorá las categorías disponibles en Mercado Justo.',
}

export default async function CategoriesPage() {
  const categories = await fetchMarketplaceCategories()

  return (
    <StaticPageShell
      title='Categorías'
      description='Navegá por las categorías del marketplace.'
    >
      {categories.length === 0 ? (
        <p className='text-muted-foreground'>Todavía no hay categorías visibles.</p>
      ) : (
        <ul className='grid gap-3 sm:grid-cols-2'>
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={HOME_PATH}
                className='block rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40'
              >
                <p className='font-medium'>{category.name}</p>
                <p className='text-sm capitalize text-muted-foreground'>{category.listingType}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </StaticPageShell>
  )
}
