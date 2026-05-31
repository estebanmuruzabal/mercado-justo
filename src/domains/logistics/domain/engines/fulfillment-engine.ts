import { type ShipmentStatus } from '@/domains/logistics/domain/types'

/**
 * Fulfillment engine — pure shipment state-machine logic.
 *
 * The shipment is the logistics unit. This engine owns:
 *  - the allowed status transitions,
 *  - terminal-state checks,
 *  - deriving an order-level logistic summary from its shipments.
 *
 * No React, no DB. Everything is a pure function so it is trivially testable
 * and reusable from server actions, queries and UI.
 */

/** Allowed transitions for a shipment's logistic status. */
const TRANSITIONS: Record<ShipmentStatus, readonly ShipmentStatus[]> = {
  pending: ['preparing', 'cancelled', 'incident'],
  preparing: ['ready_for_pickup', 'in_transit', 'cancelled', 'incident'],
  ready_for_pickup: ['in_transit', 'delivered', 'cancelled', 'incident'],
  in_transit: ['delivered', 'incident', 'cancelled'],
  delivered: [],
  cancelled: [],
  incident: ['preparing', 'in_transit', 'cancelled'],
}

const TERMINAL_STATUSES: readonly ShipmentStatus[] = ['delivered', 'cancelled']

/** "Active" = in flight, not yet in a terminal state and not stuck in incident. */
const ACTIVE_STATUSES: readonly ShipmentStatus[] = [
  'preparing',
  'ready_for_pickup',
  'in_transit',
]

export function isTerminalStatus(status: ShipmentStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function isActiveDelivery(status: ShipmentStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}

export function allowedTransitions(from: ShipmentStatus): readonly ShipmentStatus[] {
  return TRANSITIONS[from] ?? []
}

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  if (from === to) return false
  return allowedTransitions(from).includes(to)
}

/**
 * Assert a transition is legal, returning the target status. Throws otherwise.
 * Used by the audited status-override server action.
 */
export function assertTransition(from: ShipmentStatus, to: ShipmentStatus): ShipmentStatus {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid shipment transition: ${from} -> ${to}`)
  }
  return to
}

/**
 * Roll up multiple shipment statuses into a single order-level logistic status.
 *
 * Rules (most-blocking wins): any incident -> incident; else any active stage
 * -> the least-advanced active stage; else if all delivered -> delivered; else
 * if all cancelled -> cancelled; else pending.
 */
export function deriveOrderLogisticStatus(
  statuses: readonly ShipmentStatus[],
): ShipmentStatus {
  if (statuses.length === 0) return 'pending'

  if (statuses.includes('incident')) return 'incident'

  const everyIs = (s: ShipmentStatus) => statuses.every((x) => x === s)
  if (everyIs('delivered')) return 'delivered'
  if (everyIs('cancelled')) return 'cancelled'

  // Order of "in-progress" advancement from least to most advanced.
  const PROGRESS: ShipmentStatus[] = [
    'pending',
    'preparing',
    'ready_for_pickup',
    'in_transit',
  ]
  for (const stage of PROGRESS) {
    if (statuses.includes(stage)) return stage
  }

  // Mixed delivered/cancelled with nothing in-progress: treat as delivered.
  return 'delivered'
}

/** True when a shipment has been sitting in a non-terminal state too long. */
export function isStuck(
  status: ShipmentStatus,
  updatedAt: Date | string,
  now: Date = new Date(),
  thresholdHours = 48,
): boolean {
  if (isTerminalStatus(status)) return false
  const updated = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt
  const hours = (now.getTime() - updated.getTime()) / (1000 * 60 * 60)
  return hours >= thresholdHours
}
