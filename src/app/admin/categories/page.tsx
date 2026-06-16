import { requirePermission } from '@/shared/auth/guards/require-staff'
import { PERMISSIONS } from '@/shared/auth/permissions'
import { listCategoriesForAdmin } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import { listProductBasesForAdmin } from '@/domains/marketplace/product-base/application/queries/admin-product-base.queries'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { CategoriesAdminPanel } from '@/shared/admin-ui/categories/CategoriesAdminPanel'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  await requirePermission(PERMISSIONS.CATEGORIES_MANAGE)

  const [categories, productBases] = await Promise.all([
    listCategoriesForAdmin(),
    listProductBasesForAdmin(),
  ])

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Categorías'
        description={`${categories.length} categoría${categories.length === 1 ? '' : 's'} · ${productBases.length} producto${productBases.length === 1 ? '' : 's'} base en la plataforma.`}
      />
      <CategoriesAdminPanel initialCategories={categories} initialProductBases={productBases} />
    </div>
  )
}
