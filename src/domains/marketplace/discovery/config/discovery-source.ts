export type DiscoverySource = 'listing' | 'dual' | 'publication'

/**
 * Strangler migration phases — mnemonic for DISCOVERY_SOURCE values.
 *
 * Fase A → DISCOVERY_SOURCE=listing   (sunset 2026-09-30)
 * Fase B → DISCOVERY_SOURCE=dual      (sunset 2026-12-31) — enables parity logs in dev/test
 * Fase C → DISCOVERY_SOURCE=publication (permanente; default)
 */
export const DISCOVERY_MIGRATION_PHASE = {
  /** Fase A: legacy listing table only */
  A: 'listing',
  /** Fase B: dual read publication + listing, dedupe by legacy_listing_id */
  B: 'dual',
  /** Fase C: publication canonical (only permanent mode) */
  C: 'publication',
} as const satisfies Record<string, DiscoverySource>

export type DiscoveryMigrationPhase = keyof typeof DISCOVERY_MIGRATION_PHASE

export const DISCOVERY_SOURCE_SUNSET = {
  [DISCOVERY_MIGRATION_PHASE.A]: '2026-09-30',
  [DISCOVERY_MIGRATION_PHASE.B]: '2026-12-31',
} as const

/** Canonical mode after migration; only permanent mode (Fase C). */
export const DISCOVERY_SOURCE_CANONICAL = DISCOVERY_MIGRATION_PHASE.C

function isPastSunset(isoDate: string): boolean {
  const sunset = new Date(`${isoDate}T23:59:59.999Z`)
  return Date.now() > sunset.getTime()
}

function warnIfSunsetMode(source: DiscoverySource): void {
  if (source !== DISCOVERY_MIGRATION_PHASE.A && source !== DISCOVERY_MIGRATION_PHASE.B) {
    return
  }

  const env = process.env.NODE_ENV
  if (env !== 'development' && env !== 'test') {
    return
  }

  const sunsetDate = DISCOVERY_SOURCE_SUNSET[source]
  if (!isPastSunset(sunsetDate)) {
    return
  }

  console.warn(
    `[discovery] DISCOVERY_SOURCE=${source} is past sunset (${sunsetDate}). ` +
      `Remove Fase ${source === DISCOVERY_MIGRATION_PHASE.A ? 'A' : 'B'} and use ` +
      `${DISCOVERY_SOURCE_CANONICAL} only.`,
  )
}

/**
 * Controls discovery read path (Strangler migration).
 * - listing: legacy listing table only (Fase A)
 * - dual: merge publication + listing, dedupe by legacy_listing_id (Fase B)
 * - publication: publication canonical, listing fallback for orphans (Fase C)
 */
export function getDiscoverySource(): DiscoverySource {
  const raw =
    process.env.DISCOVERY_SOURCE?.toLowerCase() ??
    process.env.NEXT_PUBLIC_DISCOVERY_SOURCE?.toLowerCase()

  let source: DiscoverySource
  if (raw === 'listing' || raw === 'dual' || raw === 'publication') {
    source = raw
  } else {
    source = DISCOVERY_SOURCE_CANONICAL
  }

  warnIfSunsetMode(source)
  return source
}
