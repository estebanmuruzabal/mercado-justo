import { requirePermission } from '@/shared/auth/guards/require-staff'
import { PERMISSIONS } from '@/shared/auth/permissions'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { LogisticsDashboard } from '@/shared/admin-ui/logistics/LogisticsDashboard'
import {
  getActiveFulfillmentRequests,
  getBatchingCandidates,
  getLogisticsDashboardStats,
  getPickupWindows,
} from '@/domains/logistics/application/queries/logistics.queries'

export const dynamic = 'force-dynamic'

export default async function AdminLogisticsPage() {
  await requirePermission(PERMISSIONS.LOGISTICS_MANAGE)
  const [stats, activeRequests, pickupWindows, batchingCandidates] = await Promise.all([
    getLogisticsDashboardStats(),
    getActiveFulfillmentRequests(),
    getPickupWindows(),
    getBatchingCandidates(),
  ])

  return (
    <div className='mx-auto max-w-7xl space-y-6'>
      <PageHeader
        title='Logística'
        description='Delivery Mercado Justo, pickup coordination y preparación para batching multi-vendor.'
      />
      <LogisticsDashboard
        stats={stats}
        activeRequests={activeRequests}
        pickupWindows={pickupWindows}
        batchingCandidates={batchingCandidates}
      />
    </div>
  )
}
