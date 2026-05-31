import { requirePermission } from '@/shared/auth/guards/require-staff'
import { PERMISSIONS, can } from '@/shared/auth/permissions'
import { listOrdersForAdmin } from '@/domains/marketplace/orders/application/queries/admin-orders.queries'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { OrdersBoard } from '@/shared/admin-ui/orders/OrdersBoard'

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
