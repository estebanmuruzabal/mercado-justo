/**
 * Placeholder module for publication type: event
 * Replace with full editor UI when DittoWorld event flows ship.
 */
export const EVENT_TYPE_DEFINITION = {
  code: 'event',
  schemaVersion: 1,
  requiredAttributes: ['startsAt', 'endsAt', 'venue'],
} as const
