import { NOTIFICATION_EVENT_HANDLERS } from './handlers'
import type { AppNotificationEvent } from './types'

/**
 * Fan-out a domain event to all registered channel handlers.
 *
 * Resilient: logs handler failures, never throws. This is the future seam for
 * queues, retries, and analytics.
 */
export async function dispatchNotificationEvent(event: AppNotificationEvent): Promise<void> {
  const handlers = NOTIFICATION_EVENT_HANDLERS[event.type]

  await Promise.all(
    handlers.map(async (handler) => {
      try {
        await handler(event.payload as never)
      } catch (err) {
        console.error(
          `[notifications] handler for "${event.type}" failed:`,
          err instanceof Error ? err.message : err,
        )
      }
    }),
  )
}
