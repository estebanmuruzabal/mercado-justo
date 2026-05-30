import { requirePermission } from '@/server/auth/require-staff'
import { PERMISSIONS, can } from '@/lib/auth/permissions'
import { listVendorsForAdmin } from '@/server/queries/admin/vendors.queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { VendorsTable } from '@/components/admin/vendors/VendorsTable'

export const dynamic = 'force-dynamic'

export default async function AdminVendorsPage() {
  const { role } = await requirePermission(PERMISSIONS.VENDORS_VIEW)
  const vendors = await listVendorsForAdmin()

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Vendors'
        description={`${vendors.length} tiendas en la plataforma.`}
      />
      <VendorsTable
        vendors={vendors}
        capabilities={{
          canApprove: can(role, PERMISSIONS.VENDORS_APPROVE),
          canSuspend: can(role, PERMISSIONS.VENDORS_SUSPEND),
          canDisable: can(role, PERMISSIONS.VENDORS_DISABLE),
        }}
      />
    </div>
  )
}
