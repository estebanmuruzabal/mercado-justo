import { NOTIFICATION_EVENT_HANDLERS } from '@/shared/events/registry/handlers'
import type { AppNotificationEvent } from '@/shared/events/types'

/**
 * Fan-out a domain event to all registered channel handlers.
 */
export async function dispatchNotificationEvent(event: AppNotificationEvent): Promise<void> {
  const handlers = NOTIFICATION_EVENT_HANDLERS[event.type]

  await Promise.all(
    handlers.map(async (handler) => {
      try {
        await handler(event.payload as never)
      } catch (err) {
        console.error(
          `[events] handler for "${event.type}" failed:`,
          err instanceof Error ? err.message : err,
        )
      }
    }),
  )
}
