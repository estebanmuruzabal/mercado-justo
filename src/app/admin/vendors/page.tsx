import { requireSuperAdmin } from '@/shared/auth/guards/require-staff'
import { listVendorsForAdmin } from '@/domains/vendors/application/queries/admin-vendors.queries'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { VendorsTable } from '@/shared/admin-ui/vendors/VendorsTable'

export const dynamic = 'force-dynamic'

export default async function AdminVendorsPage() {
  await requireSuperAdmin()
  const vendors = await listVendorsForAdmin()

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Vendedores'
        description={`${vendors.length} tiendas en la plataforma.`}
      />
      <VendorsTable vendors={vendors} />
    </div>
  )
}
