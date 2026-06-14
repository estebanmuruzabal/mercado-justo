import { listCategoriesForAdmin } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import {
  getOfficialDittoBotVendorForAdmin,
  listDittoBotProductsForAdmin,
} from '@/domains/dittobots/application/queries/admin-ditto-bot-products.queries'
import { DittoBotProductsPanel } from '@/shared/admin-ui/dittobots/DittoBotProductsPanel'

export const dynamic = 'force-dynamic'

export default async function AdminDittoBotProductsPage() {
  const [products, categories, official] = await Promise.all([
    listDittoBotProductsForAdmin(),
    listCategoriesForAdmin(),
    getOfficialDittoBotVendorForAdmin(),
  ])

  if (!official) {
    return (
      <p className='text-sm text-destructive'>
        No hay vendor oficial DittoBot configurado.
      </p>
    )
  }

  return (
    <DittoBotProductsPanel
      initialProducts={products}
      categories={categories}
      officialVendorId={official.id}
    />
  )
}
