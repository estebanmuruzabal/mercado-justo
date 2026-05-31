import { requirePermission } from '@/shared/auth/guards/require-staff'
import { PERMISSIONS } from '@/shared/auth/permissions'
import { listCategoriesForAdmin } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { CategoriesAdminPanel } from '@/shared/admin-ui/categories/CategoriesAdminPanel'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  await requirePermission(PERMISSIONS.CATEGORIES_MANAGE)
  const categories = await listCategoriesForAdmin()

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Categorías'
        description={`${categories.length} categoría${categories.length === 1 ? '' : 's'} en la plataforma.`}
      />
      <CategoriesAdminPanel initialCategories={categories} />
    </div>
  )
}
