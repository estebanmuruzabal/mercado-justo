import { requirePermission } from '@/server/auth/require-staff'
import { PERMISSIONS, can } from '@/lib/auth/permissions'
import { listListingsForAdmin } from '@/server/queries/admin/listings.queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { ListingsModerationTable } from '@/components/admin/listings/ListingsModerationTable'

export const dynamic = 'force-dynamic'

export default async function AdminListingsPage() {
  const { role } = await requirePermission(PERMISSIONS.LISTINGS_VIEW)
  const { listings } = await listListingsForAdmin()

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Productos / Listings'
        description='Moderación de productos: imágenes, títulos, descripciones y categorías.'
      />
      <ListingsModerationTable
        listings={listings}
        canModerate={can(role, PERMISSIONS.LISTINGS_MODERATE)}
      />
    </div>
  )
}
