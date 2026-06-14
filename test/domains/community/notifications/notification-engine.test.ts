import { describe, expect, it } from 'vitest'

import {
  type AlertInputs,
  buildOpsAlerts,
  countBySeverity,
} from '@/domains/community/notifications/domain/notification-engine'

const now = new Date('2026-05-29T12:00:00Z')

const emptyInputs: AlertInputs = {
  shipments: [],
  failedPayments: [],
  offlineVendors: [],
  telegramErrors: [],
}

describe('buildOpsAlerts', () => {
  it('returns empty for no signals', () => {
    expect(buildOpsAlerts(emptyInputs, { now })).toEqual([])
  })

  it('surfaces incidents as critical and stuck shipments as warnings', () => {
    const alerts = buildOpsAlerts(
      {
        ...emptyInputs,
        shipments: [
          { id: 'a', status: 'incident', storeName: 'A', updatedAt: now.toISOString() },
          { id: 'b', status: 'preparing', storeName: 'B', updatedAt: '2026-05-26T00:00:00Z' },
          { id: 'c', status: 'preparing', storeName: 'C', updatedAt: now.toISOString() },
        ],
      },
      { now, stuckHours: 48 },
    )
    expect(alerts.map((a) => a.kind)).toEqual(['logistics_incident', 'stuck_shipment'])
  })

  it('sorts critical before warning before info', () => {
    const alerts = buildOpsAlerts(
      {
        ...emptyInputs,
        failedPayments: [{ orderId: 'o1', storeName: 'A', createdAt: now.toISOString() }],
        offlineVendors: [{ storeId: 's1', storeName: 'B', lastActiveAt: null }],
        telegramErrors: [
          { storeId: 's2', storeName: 'C', message: 'boom', createdAt: now.toISOString() },
        ],
      },
      { now },
    )
    expect(alerts.map((a) => a.severity)).toEqual(['critical', 'warning', 'info'])
  })
})

describe('countBySeverity', () => {
  it('tallies alerts', () => {
    const alerts = buildOpsAlerts(
      {
        ...emptyInputs,
        failedPayments: [{ orderId: 'o1', storeName: 'A', createdAt: now.toISOString() }],
      },
      { now },
    )
    expect(countBySeverity(alerts)).toEqual({ critical: 1, warning: 0, info: 0 })
  })
})
