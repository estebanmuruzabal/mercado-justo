import { type CarbonLevel } from '@/domains/logistics/domain/types'

/**
 * Sustainability engine — distance to carbon-impact estimate.
 *
 * This is an intentionally simple, transparent heuristic based on haversine
 * distance ranges (not a scientific model). Phase 2 can swap the internals for
 * a richer model without changing the public surface.
 */

export type CarbonPresentation = {
  level: CarbonLevel
  label: string
  /** Tailwind-friendly soft token classes (background/text) for badges. */
  badgeClass: string
  /** Lucide icon name (resolved in the UI layer). */
  icon: 'Leaf' | 'Bike' | 'Car' | 'Truck'
}

const RANGES: { max: number; level: CarbonLevel }[] = [
  { max: 2, level: 'very_low' },
  { max: 5, level: 'low' },
  { max: 10, level: 'medium' },
  { max: Infinity, level: 'high' },
]

/** Map a distance (km) to a carbon level. Null/negative distances are unknown -> 'low'. */
export function getCarbonLevel(distanceKm: number | null | undefined): CarbonLevel {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) {
    return 'low'
  }
  return RANGES.find((r) => distanceKm <= r.max)!.level
}

const PRESENTATION: Record<CarbonLevel, CarbonPresentation> = {
  very_low: {
    level: 'very_low',
    label: 'Muy bajo',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    icon: 'Leaf',
  },
  low: {
    level: 'low',
    label: 'Bajo',
    badgeClass: 'bg-green-50 text-green-700',
    icon: 'Bike',
  },
  medium: {
    level: 'medium',
    label: 'Medio',
    badgeClass: 'bg-amber-50 text-amber-700',
    icon: 'Car',
  },
  high: {
    level: 'high',
    label: 'Alto',
    badgeClass: 'bg-rose-50 text-rose-700',
    icon: 'Truck',
  },
}

export function getCarbonPresentation(level: CarbonLevel): CarbonPresentation {
  return PRESENTATION[level]
}

/**
 * Rough relative carbon-footprint score for aggregation/KPIs. Returns an
 * abstract "impact unit" proportional to distance, weighted by method.
 */
export function estimateCarbonScore(
  distanceKm: number | null | undefined,
  method?: string | null,
): number {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm <= 0) return 0
  const factor = method === 'pickup' ? 0.2 : method === 'own_delivery' ? 0.8 : 1
  return Math.round(distanceKm * factor * 100) / 100
}

/** Aggregate a list of shipment distances into a total estimated impact. */
export function aggregateCarbonScore(
  shipments: { distanceKm: number | null; deliveryMethod?: string | null }[],
): number {
  const total = shipments.reduce(
    (sum, s) => sum + estimateCarbonScore(s.distanceKm, s.deliveryMethod),
    0,
  )
  return Math.round(total * 100) / 100
}
