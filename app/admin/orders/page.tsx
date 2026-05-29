import { requirePermission } from '@/server/auth/require-staff'
import { PERMISSIONS, can } from '@/lib/auth/permissions'
import { listOrdersForAdmin } from '@/server/queries/admin/orders.queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { OrdersBoard } from '@/components/admin/orders/OrdersBoard'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const { role } = await requirePermission(PERMISSIONS.ORDERS_VIEW)
  const { orders, vendors } = await listOrdersForAdmin()

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Órdenes'
        description='Organizadas por estado logístico de sus envíos.'
      />
      <OrdersBoard
        orders={orders}
        vendors={vendors}
        canOverride={can(role, PERMISSIONS.SHIPMENTS_OVERRIDE)}
      />
    </div>
  )
}
