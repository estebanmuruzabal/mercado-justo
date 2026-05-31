import { Banknote, Gauge, Leaf, MapPin, ShoppingBag, Users } from 'lucide-react'

import { requirePermission } from '@/shared/auth/guards/require-staff'
import { PERMISSIONS } from '@/shared/auth/permissions'
import { getAnalyticsSummary } from '@/domains/logistics/application/queries/analytics.queries'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { KpiCard } from '@/shared/admin-ui/ui/KpiCard'
import { Card, CardContent } from '@/shared/ui/card'
import { formatCurrency, formatNumber } from '@/shared/utils/admin-format'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  await requirePermission(PERMISSIONS.ANALYTICS_VIEW)
  const a = await getAnalyticsSummary()

  return (
    <div className='mx-auto max-w-7xl space-y-6'>
      <PageHeader
        title='Analytics'
        description='Base de métricas: GMV, ventas, retención, eficiencia de delivery e impacto ambiental.'
      />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <KpiCard label='GMV' value={formatCurrency(a.gmv)} icon={Banknote} accentClass='bg-emerald-100 text-emerald-700' />
        <KpiCard label='Órdenes' value={formatNumber(a.orderCount)} icon={ShoppingBag} accentClass='bg-sky-100 text-sky-700' hint={`Ticket promedio ${formatCurrency(a.averageOrderValue)}`} />
        <KpiCard label='Compradores únicos' value={formatNumber(a.uniqueBuyers)} icon={Users} accentClass='bg-violet-100 text-violet-700' />
        <KpiCard label='Eficiencia delivery' value={`${a.deliveryEfficiency}%`} icon={Gauge} accentClass='bg-blue-100 text-blue-700' hint={`${formatNumber(a.deliveredShipments)} de ${formatNumber(a.totalShipments)} envíos`} />
        <KpiCard label='Distancia promedio' value={`${a.averageDistanceKm} km`} icon={MapPin} accentClass='bg-amber-100 text-amber-700' />
        <KpiCard label='Huella estimada' value={`${formatNumber(a.carbonScore)} u`} icon={Leaf} accentClass='bg-green-100 text-green-700' />
      </div>

      <Card>
        <CardContent className='p-5 text-sm text-muted-foreground'>
          Las series temporales, cohortes de retención y desgloses por zona se incorporan en la
          próxima fase sobre esta misma base de datos.
        </CardContent>
      </Card>
    </div>
  )
}
