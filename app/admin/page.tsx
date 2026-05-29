import {
  AlertTriangle,
  Clock,
  DollarSign,
  Leaf,
  ShoppingBag,
  Store,
  Truck,
  UserPlus,
} from 'lucide-react'

import { requirePermission } from '@/server/auth/require-staff'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { getAdminDashboardKpis } from '@/server/queries/admin/dashboard.queries'
import { formatCurrency, formatNumber } from '@/lib/admin/format'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { KpiCard } from '@/components/admin/ui/KpiCard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  await requirePermission(PERMISSIONS.ADMIN_ACCESS)
  const kpis = await getAdminDashboardKpis()

  const cards = [
    { label: 'Ventas totales', value: formatCurrency(kpis.totalSales), icon: DollarSign, accentClass: 'bg-emerald-100 text-emerald-700' },
    { label: 'Órdenes pendientes', value: formatNumber(kpis.pendingOrders), icon: Clock, accentClass: 'bg-amber-100 text-amber-700' },
    { label: 'Deliveries activos', value: formatNumber(kpis.activeDeliveries), icon: Truck, accentClass: 'bg-blue-100 text-blue-700' },
    { label: 'Vendors activos', value: formatNumber(kpis.activeVendors), icon: Store, accentClass: 'bg-indigo-100 text-indigo-700' },
    { label: 'Nuevos usuarios (7d)', value: formatNumber(kpis.newUsers), icon: UserPlus, accentClass: 'bg-violet-100 text-violet-700' },
    { label: 'Pedidos del día', value: formatNumber(kpis.ordersToday), icon: ShoppingBag, accentClass: 'bg-sky-100 text-sky-700' },
    { label: 'Problemas / reportes', value: formatNumber(kpis.openIssues), icon: AlertTriangle, accentClass: 'bg-rose-100 text-rose-700' },
    { label: 'Huella carbono estimada', value: `${formatNumber(kpis.carbonScore)} u`, icon: Leaf, accentClass: 'bg-green-100 text-green-700' },
  ]

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Dashboard'
        description='Métricas globales del marketplace en tiempo real.'
      />
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {cards.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>
    </div>
  )
}
