import {
  AlertTriangle,
  Clock,
  DollarSign,
  FolderTree,
  Leaf,
  Package,
  ShoppingBag,
  Store,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react'

import { requirePermission } from '@/shared/auth/guards/require-staff'
import { PERMISSIONS } from '@/shared/auth/permissions'
import { getAdminDashboardKpis } from '@/domains/logistics/application/queries/dashboard.queries'
import { formatCurrency, formatNumber } from '@/shared/utils/admin-format'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { KpiCard } from '@/shared/admin-ui/ui/KpiCard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  await requirePermission(PERMISSIONS.ADMIN_ACCESS)
  const kpis = await getAdminDashboardKpis()

  const operationalCards = [
    { label: 'Ventas totales', value: formatCurrency(kpis.totalSales), icon: DollarSign, accentClass: 'bg-emerald-100 text-emerald-700' },
    { label: 'Órdenes pendientes', value: formatNumber(kpis.pendingOrders), icon: Clock, accentClass: 'bg-amber-100 text-amber-700' },
    { label: 'Deliveries activos', value: formatNumber(kpis.activeDeliveries), icon: Truck, accentClass: 'bg-blue-100 text-blue-700' },
    { label: 'Vendedores activos', value: formatNumber(kpis.activeVendors), icon: Store, accentClass: 'bg-indigo-100 text-indigo-700' },
    { label: 'Nuevos usuarios (7d)', value: formatNumber(kpis.newUsers), icon: UserPlus, accentClass: 'bg-violet-100 text-violet-700' },
    { label: 'Pedidos del día', value: formatNumber(kpis.ordersToday), icon: ShoppingBag, accentClass: 'bg-sky-100 text-sky-700' },
    { label: 'Problemas / reportes abiertos', value: formatNumber(kpis.openIssues), icon: AlertTriangle, accentClass: 'bg-rose-100 text-rose-700' },
    { label: 'Huella carbono estimada', value: `${formatNumber(kpis.carbonScore)} u`, icon: Leaf, accentClass: 'bg-green-100 text-green-700' },
  ]

  const platformCards = [
    { label: 'Total usuarios', value: formatNumber(kpis.totalUsers), icon: Users, accentClass: 'bg-violet-100 text-violet-700' },
    { label: 'Total vendedores', value: formatNumber(kpis.totalVendors), icon: Users, accentClass: 'bg-indigo-100 text-indigo-700' },
    { label: 'Total publicaciones', value: formatNumber(kpis.totalListings), icon: Package, accentClass: 'bg-sky-100 text-sky-700' },
    { label: 'Total tiendas', value: formatNumber(kpis.totalStores), icon: Store, accentClass: 'bg-emerald-100 text-emerald-700' },
    { label: 'Total reportes', value: formatNumber(kpis.totalReports), icon: AlertTriangle, accentClass: 'bg-rose-100 text-rose-700' },
    { label: 'Total categorías', value: formatNumber(kpis.totalCategories), icon: FolderTree, accentClass: 'bg-amber-100 text-amber-700' },
  ]

  return (
    <div className='mx-auto max-w-7xl space-y-8'>
      <PageHeader
        title='Dashboard'
        description='Métricas globales del marketplace en tiempo real.'
      />
      <section>
        <h2 className='mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Operaciones
        </h2>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {operationalCards.map((c) => (
            <KpiCard key={c.label} {...c} />
          ))}
        </div>
      </section>
      <section>
        <h2 className='mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Plataforma
        </h2>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {platformCards.map((c) => (
            <KpiCard key={c.label} {...c} />
          ))}
        </div>
      </section>
    </div>
  )
}
