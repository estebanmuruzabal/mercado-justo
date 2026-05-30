import { type ShipmentStatus } from '@/lib/admin/types'
import { isStuck } from '@/lib/admin/engines/fulfillment-engine'

/**
 * Notification engine — derives the operational alert center from raw platform
 * data. Pure: callers pass plain snapshots, the engine returns typed alerts.
 */

export type AlertSeverity = 'critical' | 'warning' | 'info'

export type AlertKind =
  | 'telegram_error'
  | 'stuck_shipment'
  | 'failed_payment'
  | 'vendor_offline'
  | 'logistics_incident'

export type OpsAlert = {
  id: string
  kind: AlertKind
  severity: AlertSeverity
  title: string
  description: string
  entityType: string
  entityId: string
  href?: string
  createdAt: string
}

export type AlertInputs = {
  shipments: {
    id: string
    status: ShipmentStatus
    storeName: string
    updatedAt: string
  }[]
  failedPayments: {
    orderId: string
    storeName: string
    createdAt: string
  }[]
  offlineVendors: {
    storeId: string
    storeName: string
    lastActiveAt: string | null
  }[]
  telegramErrors: {
    storeId: string
    storeName: string
    message: string
    createdAt: string
  }[]
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

/**
 * Build a flat, severity-sorted list of operational alerts. `now`/`stuckHours`
 * are injectable for deterministic tests.
 */
export function buildOpsAlerts(
  inputs: AlertInputs,
  options: { now?: Date; stuckHours?: number } = {},
): OpsAlert[] {
  const now = options.now ?? new Date()
  const stuckHours = options.stuckHours ?? 48
  const alerts: OpsAlert[] = []

  for (const s of inputs.shipments) {
    if (s.status === 'incident') {
      alerts.push({
        id: `incident:${s.id}`,
        kind: 'logistics_incident',
        severity: 'critical',
        title: 'Incidencia logística',
        description: `Envío de ${s.storeName} marcado como incidencia.`,
        entityType: 'shipment',
        entityId: s.id,
        createdAt: s.updatedAt,
      })
    } else if (isStuck(s.status, s.updatedAt, now, stuckHours)) {
      alerts.push({
        id: `stuck:${s.id}`,
        kind: 'stuck_shipment',
        severity: 'warning',
        title: 'Pedido trabado',
        description: `Envío de ${s.storeName} sin avanzar (${s.status}) hace +${stuckHours}h.`,
        entityType: 'shipment',
        entityId: s.id,
        createdAt: s.updatedAt,
      })
    }
  }

  for (const p of inputs.failedPayments) {
    alerts.push({
      id: `payment:${p.orderId}`,
      kind: 'failed_payment',
      severity: 'critical',
      title: 'Pago fallido',
      description: `Pago fallido en pedido de ${p.storeName}.`,
      entityType: 'order',
      entityId: p.orderId,
      createdAt: p.createdAt,
    })
  }

  for (const v of inputs.offlineVendors) {
    alerts.push({
      id: `offline:${v.storeId}`,
      kind: 'vendor_offline',
      severity: 'info',
      title: 'Vendor inactivo',
      description: `${v.storeName} sin actividad reciente.`,
      entityType: 'store',
      entityId: v.storeId,
      createdAt: v.lastActiveAt ?? now.toISOString(),
    })
  }

  for (const t of inputs.telegramErrors) {
    alerts.push({
      id: `telegram:${t.storeId}`,
      kind: 'telegram_error',
      severity: 'warning',
      title: 'Error de Telegram',
      description: `${t.storeName}: ${t.message}`,
      entityType: 'store',
      entityId: t.storeId,
      createdAt: t.createdAt,
    })
  }

  return alerts.sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    if (sev !== 0) return sev
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export function countBySeverity(alerts: readonly OpsAlert[]): Record<AlertSeverity, number> {
  return alerts.reduce(
    (acc, a) => {
      acc[a.severity] += 1
      return acc
    },
    { critical: 0, warning: 0, info: 0 } as Record<AlertSeverity, number>,
  )
}
