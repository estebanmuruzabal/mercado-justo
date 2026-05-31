import { requirePermission } from '@/server/auth/require-staff'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { listCategoriesForAdmin } from '@/server/queries/admin/categories.queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { CategoriesAdminPanel } from '@/components/admin/categories/CategoriesAdminPanel'

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
