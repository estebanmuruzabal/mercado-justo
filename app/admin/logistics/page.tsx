import { Bike, Car, Clock, Package, Truck } from 'lucide-react'

import { requirePermission } from '@/server/auth/require-staff'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { getLogisticsOverview } from '@/server/queries/admin/logistics.queries'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { KpiCard } from '@/components/admin/ui/KpiCard'
import { StatusBadge } from '@/components/admin/ui/StatusBadge'
import { SHIPMENT_STATUS_PRESENTATION } from '@/lib/admin/status-presentation'
import { formatNumber } from '@/lib/admin/format'

export const dynamic = 'force-dynamic'

const METHOD_LABELS: Record<string, string> = {
  pickup: 'Pickup',
  own_delivery: 'Delivery propio',
  mj_delivery: 'Mercado Justo',
}

const PICKUP_WINDOWS = [
  { label: 'Mañana', range: '08:00 — 11:00' },
  { label: 'Tarde', range: '14:00 — 16:00' },
]

export default async function AdminLogisticsPage() {
  await requirePermission(PERMISSIONS.LOGISTICS_MANAGE)
  const { activeShipments, methodCounts, batchableCount } = await getLogisticsOverview()

  return (
    <div className='mx-auto max-w-7xl space-y-6'>
      <PageHeader
        title='Logística'
        description='Delivery Mercado Justo, pickup coordination y preparación para batching multi-vendor.'
      />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <KpiCard label='Deliveries activos' value={formatNumber(activeShipments.length)} icon={Truck} accentClass='bg-blue-100 text-blue-700' />
        <KpiCard label='Mercado Justo' value={formatNumber(methodCounts.mj_delivery)} icon={Bike} accentClass='bg-green-100 text-green-700' />
        <KpiCard label='Delivery propio' value={formatNumber(methodCounts.own_delivery)} icon={Car} accentClass='bg-amber-100 text-amber-700' />
        <KpiCard label='Pickup' value={formatNumber(methodCounts.pickup)} icon={Package} accentClass='bg-indigo-100 text-indigo-700' />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Card>
          <CardContent className='p-5'>
            <div className='mb-3 flex items-center gap-2 text-sm font-semibold'>
              <Clock className='h-4 w-4 text-muted-foreground' /> Ventanas de pickup
            </div>
            <div className='grid grid-cols-2 gap-3'>
              {PICKUP_WINDOWS.map((w) => (
                <div key={w.label} className='rounded-xl border bg-muted/30 p-4'>
                  <div className='text-sm text-muted-foreground'>{w.label}</div>
                  <div className='text-lg font-semibold tabular-nums'>{w.range}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-5'>
            <div className='mb-1 text-sm font-semibold'>Batching multi-vendor</div>
            <p className='text-sm text-muted-foreground'>
              {formatNumber(batchableCount)} envíos activos son candidatos a agruparse en un solo
              delivery. La asignación automática de batches y rutas llega en la próxima fase.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className='p-0'>
          <div className='border-b px-5 py-4 text-sm font-semibold'>Envíos en curso</div>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Ventana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center text-muted-foreground'>
                      No hay envíos activos.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeShipments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className='font-medium'>{s.vendorName}</TableCell>
                      <TableCell>
                        <StatusBadge presentation={SHIPMENT_STATUS_PRESENTATION[s.status]} />
                      </TableCell>
                      <TableCell className='text-sm'>
                        {s.deliveryMethod ? METHOD_LABELS[s.deliveryMethod] ?? s.deliveryMethod : '—'}
                      </TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {s.scheduledWindow?.start
                          ? `${s.scheduledWindow.start} — ${s.scheduledWindow.end ?? ''}`
                          : 'Sin programar'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
