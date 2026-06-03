import { listCategoriesForAdmin } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import { listProductBasesForAdmin } from '@/domains/marketplace/product-base/application/queries/admin-product-base.queries'
import { requirePermission } from '@/shared/auth/guards/require-staff'
import { PERMISSIONS } from '@/shared/auth/permissions'
import { ProductBasesAdminPanel } from '@/shared/admin-ui/product-bases/ProductBasesAdminPanel'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'

export const dynamic = 'force-dynamic'

export default async function AdminProductBasesPage() {
  await requirePermission(PERMISSIONS.PRODUCT_BASES_MANAGE)

  const [productBases, categories] = await Promise.all([
    listProductBasesForAdmin(),
    listCategoriesForAdmin(),
  ])

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Productos Base'
        description={`${productBases.length} plantilla${productBases.length === 1 ? '' : 's'} maestra${productBases.length === 1 ? '' : 's'} registrada${productBases.length === 1 ? '' : 's'}.`}
      />
      <ProductBasesAdminPanel initialProductBases={productBases} categories={categories} />
    </div>
  )
}
