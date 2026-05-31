import { requireSuperAdmin } from '@/server/auth/require-staff'
import { listVendorsForAdmin } from '@/server/queries/admin/vendors.queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { VendorsTable } from '@/components/admin/vendors/VendorsTable'

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
