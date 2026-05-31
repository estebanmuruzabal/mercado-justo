export type GrowerHealthStatus = 'healthy' | 'attention_required' | 'assistance_required'

/**
 * Super Admin dashboard row (R5.3 design — no UI / telemetry yet).
 */
export type GrowerNetworkMemberSummary = {
  userId: string
  dittoBotCount: number
  activeProtocolCount: number
  healthStatus: GrowerHealthStatus
  approximateLocation?: {
    region: string
    lat?: number
    lng?: number
  }
}

/** Administrative map pin — approximate location only (fuzzed). */
export type GrowerMapPin = {
  growerUserId: string
  approximateLocation: {
    region: string
    lat?: number
    lng?: number
  }
  dittoBotCount: number
  activeProtocolCount: number
  healthStatus: GrowerHealthStatus
  alertCount: number
}

/**
 * Future telemetry inputs (R5.6+) — documented for proactive support design.
 */
export type GrowerHealthSignals = {
  offlineDittoBotCount: number
  sensorsNotReportingCount: number
  repeatedErrorCount: number
  failingProtocolCount: number
  outOfRangeParameterCount: number
}
