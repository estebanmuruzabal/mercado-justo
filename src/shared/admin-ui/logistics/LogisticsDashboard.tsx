import { Bike, Car, Clock, Package, Truck } from 'lucide-react'

import { Card, CardContent } from '@/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { KpiCard } from '@/shared/admin-ui/ui/KpiCard'
import { StatusBadge } from '@/shared/admin-ui/ui/StatusBadge'
import { SHIPMENT_STATUS_PRESENTATION } from '@/shared/utils/admin-status-presentation'
import { formatNumber } from '@/shared/utils/admin-format'
import type {
  FulfillmentBatchingCandidate,
  FulfillmentRequestRow,
  LogisticsDashboardStats,
  PickupWindowRow,
} from '@/domains/logistics/domain/types'

function formatWindowRange(window: PickupWindowRow) {
  return `${window.startTime} — ${window.endTime}`
}

function formatScheduledWindowLabel(request: FulfillmentRequestRow) {
  if (request.pickupWindowLabel) return request.pickupWindowLabel
  if (!request.scheduledWindow?.start) return 'Sin programar'
  const end = request.scheduledWindow.end ? ` — ${request.scheduledWindow.end}` : ''
  return `${request.scheduledWindow.start}${end}`
}

export function LogisticsDashboard({
  stats,
  pickupWindows,
  activeRequests,
  batchingCandidates,
}: {
  stats: LogisticsDashboardStats
  pickupWindows: PickupWindowRow[]
  activeRequests: FulfillmentRequestRow[]
  batchingCandidates: FulfillmentBatchingCandidate[]
}) {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <KpiCard
          label='Deliveries activos'
          value={formatNumber(stats.activeDeliveries)}
          icon={Truck}
          accentClass='bg-blue-100 text-blue-700'
        />
        <KpiCard
          label='Mercado Justo / DittoVan'
          value={formatNumber(stats.totalMercadoJusto)}
          icon={Bike}
          accentClass='bg-green-100 text-green-700'
        />
        <KpiCard
          label='Delivery propio'
          value={formatNumber(stats.totalDeliveryPropio)}
          icon={Car}
          accentClass='bg-amber-100 text-amber-700'
        />
        <KpiCard
          label='Pickup'
          value={formatNumber(stats.totalPickup)}
          icon={Package}
          accentClass='bg-indigo-100 text-indigo-700'
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Card>
          <CardContent className='p-5'>
            <div className='mb-3 flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2 text-sm font-semibold'>
                <Clock className='h-4 w-4 text-muted-foreground' />
                Ventanas de pickup configuradas
              </div>
              <span className='text-sm text-muted-foreground'>
                {formatNumber(stats.pickupWindowsConfigured)}
              </span>
            </div>

            {pickupWindows.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No hay ventanas configuradas.</p>
            ) : (
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                {pickupWindows.map((window) => (
                  <div key={window.id} className='rounded-xl border bg-muted/30 p-4'>
                    <div className='text-sm text-muted-foreground'>{window.label}</div>
                    <div className='text-lg font-semibold tabular-nums'>
                      {formatWindowRange(window)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-5'>
            <div className='mb-2 flex items-center justify-between gap-2'>
              <div>
                <div className='text-sm font-semibold'>Batching multi-vendor</div>
                <p className='text-sm text-muted-foreground'>
                  {formatNumber(stats.batchingCandidates)} candidatos activos para agrupar en un
                  solo delivery.
                </p>
              </div>
            </div>

            {batchingCandidates.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                Todavía no hay grupos multi-vendor listos para batching.
              </p>
            ) : (
              <div className='space-y-3'>
                {batchingCandidates.slice(0, 3).map((candidate) => (
                  <div key={candidate.key} className='rounded-xl border bg-background p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='space-y-1'>
                        <div className='text-sm font-medium'>{candidate.label}</div>
                        <div className='text-xs text-muted-foreground'>
                          {candidate.methodProvider === 'dittovan' ? 'DittoVan' : 'Propio'} •{' '}
                          {candidate.requestCount} requests • {candidate.vendorCount} vendors
                        </div>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {candidate.scheduledWindow?.date ?? 'Sin fecha'}
                      </div>
                    </div>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {candidate.vendorNames.slice(0, 4).map((vendorName) => (
                        <span
                          key={`${candidate.key}:${vendorName}`}
                          className='rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground'
                        >
                          {vendorName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className='p-0'>
          <div className='border-b px-5 py-4 text-sm font-semibold'>Fulfillment requests activos</div>
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
                {activeRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center text-muted-foreground'>
                      No hay fulfillment requests activos.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className='font-medium'>{request.vendorName}</TableCell>
                      <TableCell>
                        <StatusBadge
                          presentation={
                            SHIPMENT_STATUS_PRESENTATION[request.status] ??
                            SHIPMENT_STATUS_PRESENTATION.pending
                          }
                        />
                      </TableCell>
                      <TableCell className='text-sm'>{request.methodLabel}</TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {formatScheduledWindowLabel(request)}
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
