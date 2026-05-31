import { requirePermission } from '@/shared/auth/guards/require-staff'
import { PERMISSIONS, can } from '@/shared/auth/permissions'
import { listListingsForAdmin } from '@/domains/marketplace/listings/application/queries/admin-listings.queries'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { ListingsModerationTable } from '@/shared/admin-ui/listings/ListingsModerationTable'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ storeId?: string }>
}

export default async function AdminListingsPage({ searchParams }: Props) {
  const { role } = await requirePermission(PERMISSIONS.LISTINGS_VIEW)
  const { storeId } = await searchParams
  const { listings, vendors } = await listListingsForAdmin()
  const vendorName = storeId ? vendors.find((v) => v.id === storeId)?.name : undefined

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Productos / Listings'
        description={
          vendorName
            ? `Publicaciones de ${vendorName}.`
            : 'Moderación de productos: imágenes, títulos, descripciones y categorías.'
        }
      />
      <ListingsModerationTable
        listings={listings}
        canModerate={can(role, PERMISSIONS.LISTINGS_MODERATE)}
        storeIdFilter={storeId}
      />
    </div>
  )
}
