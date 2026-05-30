'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/ui/StatusBadge'
import {
  SHIPMENT_STATUS_ORDER,
  SHIPMENT_STATUS_PRESENTATION,
} from '@/lib/admin/status-presentation'
import { getCarbonPresentation } from '@/lib/admin/engines/sustainability-engine'
import { allowedTransitions } from '@/lib/admin/engines/fulfillment-engine'
import { formatCurrency, formatDateTime } from '@/lib/admin/format'
import { type ShipmentStatus } from '@/lib/admin/types'
import type { AdminOrderRow } from '@/server/queries/admin/orders.queries'
import { overrideShipmentStatusAction } from '@/server/actions/admin/shipment.actions'

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  pickup: 'Pickup',
  own_delivery: 'Delivery propio',
  mj_delivery: 'Mercado Justo',
}

export function OrdersBoard({
  orders,
  vendors,
  canOverride,
}: {
  orders: AdminOrderRow[]
  vendors: { id: string; name: string }[]
  canOverride: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ShipmentStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high'>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.logisticStatus !== statusFilter) return false
      if (priorityFilter === 'high' && o.logisticStatus !== 'incident') return false
      if (vendorFilter !== 'all' && !o.shipments.some((s) => s.vendorId === vendorFilter)) return false
      if (methodFilter !== 'all' && !o.shipments.some((s) => s.deliveryMethod === methodFilter)) return false
      if (q && !o.id.toLowerCase().includes(q) && !o.buyerName.toLowerCase().includes(q)) return false
      return true
    })
  }, [orders, search, vendorFilter, methodFilter, statusFilter, priorityFilter])

  const groups = useMemo(() => {
    return SHIPMENT_STATUS_ORDER.map((status) => ({
      status,
      orders: filtered.filter((o) => o.logisticStatus === status),
    })).filter((g) => g.orders.length > 0)
  }, [filtered])

  function override(shipmentId: string, toStatus: ShipmentStatus) {
    startTransition(async () => {
      const res = await overrideShipmentStatusAction({ shipmentId, toStatus })
      if (res.success) {
        toast.success('Estado del envío actualizado.')
        router.refresh()
      } else {
        toast.error(res.error ?? 'No se pudo actualizar el envío.')
      }
    })
  }

  return (
    <div className='space-y-5'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'>
        <div className='relative lg:col-span-2'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar por orden o comprador...'
            className='pl-9'
          />
        </div>
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger><SelectValue placeholder='Vendor' /></SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos los vendors</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger><SelectValue placeholder='Delivery' /></SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos los métodos</SelectItem>
            {Object.entries(DELIVERY_METHOD_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as 'all' | 'high')}>
          <SelectTrigger><SelectValue placeholder='Prioridad' /></SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Toda prioridad</SelectItem>
            <SelectItem value='high'>Alta (incidencias)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          onClick={() => setStatusFilter('all')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            statusFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Todos
        </button>
        {SHIPMENT_STATUS_ORDER.map((s) => (
          <button
            key={s}
            type='button'
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {SHIPMENT_STATUS_PRESENTATION[s].label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <Card className='p-10 text-center text-muted-foreground'>No hay órdenes que coincidan.</Card>
      ) : (
        <div className='space-y-6'>
          {groups.map((group) => (
            <section key={group.status} className='space-y-3'>
              <div className='flex items-center gap-2'>
                <StatusBadge presentation={SHIPMENT_STATUS_PRESENTATION[group.status]} />
                <span className='text-sm text-muted-foreground'>{group.orders.length}</span>
              </div>
              <div className='grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3'>
                {group.orders.map((order) => (
                  <Card key={order.id} className='gap-3 p-4'>
                    <div className='flex items-start justify-between gap-2'>
                      <div>
                        <div className='font-mono text-xs text-muted-foreground'>#{order.id.slice(0, 8)}</div>
                        <div className='font-medium'>{order.buyerName}</div>
                      </div>
                      <div className='text-right'>
                        <div className='font-semibold'>{formatCurrency(order.total)}</div>
                        <div className='text-xs text-muted-foreground'>{formatDateTime(order.createdAt)}</div>
                      </div>
                    </div>

                    <div className='space-y-2 border-t pt-2'>
                      {order.shipments.map((s) => {
                        const carbon = getCarbonPresentation(s.carbonLevel)
                        const targets = allowedTransitions(s.status)
                        return (
                          <div key={s.id} className='flex items-center justify-between gap-2'>
                            <div className='min-w-0'>
                              <div className='truncate text-sm font-medium'>{s.vendorName}</div>
                              <div className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                                <StatusBadge presentation={SHIPMENT_STATUS_PRESENTATION[s.status]} />
                                {s.deliveryMethod ? (
                                  <span>{DELIVERY_METHOD_LABELS[s.deliveryMethod] ?? s.deliveryMethod}</span>
                                ) : null}
                                <span className={`rounded px-1.5 py-0.5 ${carbon.badgeClass}`}>{carbon.label}</span>
                              </div>
                            </div>
                            {canOverride && targets.length > 0 ? (
                              <Select
                                value=''
                                onValueChange={(v) => override(s.id, v as ShipmentStatus)}
                              >
                                <SelectTrigger className='h-8 w-[130px] text-xs' disabled={isPending}>
                                  <SelectValue placeholder='Cambiar' />
                                </SelectTrigger>
                                <SelectContent>
                                  {targets.map((t) => (
                                    <SelectItem key={t} value={t} className='text-xs'>
                                      {SHIPMENT_STATUS_PRESENTATION[t].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
