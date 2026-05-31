import { describe, expect, it, vi, beforeEach } from 'vitest'

const { handlerA, handlerB, failingHandler } = vi.hoisted(() => ({
  handlerA: vi.fn().mockResolvedValue(undefined),
  handlerB: vi.fn().mockResolvedValue(undefined),
  failingHandler: vi.fn().mockRejectedValue(new Error('handler boom')),
}))

vi.mock('@/shared/events/registry/handlers', () => ({
  NOTIFICATION_EVENT_HANDLERS: {
    'order.created': [handlerA, failingHandler, handlerB],
    'order.delivered': [],
    'vendor.approved': [],
    'moderation.reported': [],
    'shipment.delayed': [],
    'payout.sent': [],
  },
}))

import { dispatchNotificationEvent } from '@/shared/events/bus/dispatch'

describe('dispatchNotificationEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invokes all handlers for the event type', async () => {
    await dispatchNotificationEvent({ type: 'order.created', payload: { orderId: 'ord-1' } })

    expect(handlerA).toHaveBeenCalledWith({ orderId: 'ord-1' })
    expect(handlerB).toHaveBeenCalledWith({ orderId: 'ord-1' })
    expect(failingHandler).toHaveBeenCalledWith({ orderId: 'ord-1' })
  })

  it('does not throw when a handler fails', async () => {
    await expect(
      dispatchNotificationEvent({ type: 'order.created', payload: { orderId: 'ord-2' } }),
    ).resolves.toBeUndefined()
  })

  it('no-ops for events with no handlers', async () => {
    await expect(
      dispatchNotificationEvent({ type: 'order.delivered', payload: { orderId: 'ord-3' } }),
    ).resolves.toBeUndefined()
  })
})
