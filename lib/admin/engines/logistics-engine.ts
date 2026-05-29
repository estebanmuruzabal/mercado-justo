import { haversineDistanceKm } from '@/lib/location/distance'
import type { Coordinates } from '@/lib/location/coordinates'
import { type ShipmentStatus } from '@/lib/admin/types'
import { isActiveDelivery } from '@/lib/admin/engines/fulfillment-engine'

/**
 * Logistics engine — pure primitives for grouping shipments into delivery
 * batches (multi-vendor trips). Phase 1 ships the building blocks (eligibility,
 * proximity grouping, ETA stubs); Phase 2 layers routing/optimization on top.
 */

export type BatchCandidate = {
  shipmentId: string
  storeId: string
  status: ShipmentStatus
  origin: Coordinates | null
  destination: Coordinates | null
}

/** A shipment is batchable when it is an active own/MJ delivery with known geo. */
export function isBatchEligible(candidate: BatchCandidate): boolean {
  return (
    isActiveDelivery(candidate.status) &&
    candidate.origin != null &&
    candidate.destination != null
  )
}

/**
 * Greedy proximity grouping: cluster eligible shipments whose destinations fall
 * within `radiusKm` of the group's first member. Deterministic and dependency-free
 * (good enough for Phase 1; replaced by real routing later).
 */
export function groupByProximity(
  candidates: readonly BatchCandidate[],
  radiusKm = 3,
): BatchCandidate[][] {
  const eligible = candidates.filter(isBatchEligible)
  const groups: BatchCandidate[][] = []
  const used = new Set<string>()

  for (const seed of eligible) {
    if (used.has(seed.shipmentId)) continue
    const group: BatchCandidate[] = [seed]
    used.add(seed.shipmentId)

    for (const other of eligible) {
      if (used.has(other.shipmentId)) continue
      const d = haversineDistanceKm(seed.destination!, other.destination!)
      if (d <= radiusKm) {
        group.push(other)
        used.add(other.shipmentId)
      }
    }
    groups.push(group)
  }

  return groups
}

/**
 * Naive ETA estimate in minutes from distance, assuming an urban average speed.
 * Stub for Phase 1 — returns null when distance is unknown.
 */
export function estimateEtaMinutes(
  distanceKm: number | null | undefined,
  avgSpeedKmh = 25,
): number | null {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) return null
  const prepBufferMin = 15
  return Math.round((distanceKm / avgSpeedKmh) * 60 + prepBufferMin)
}

/** How many vendor trips a set of batches would save versus per-shipment delivery. */
export function tripsSaved(groups: readonly BatchCandidate[][]): number {
  const shipments = groups.reduce((sum, g) => sum + g.length, 0)
  const batches = groups.length
  return Math.max(0, shipments - batches)
}
