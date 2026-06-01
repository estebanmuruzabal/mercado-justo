import type { DittoBotInventoryStatus } from './ditto-bot-inventory-unit'

export type GrowerHealthStatus = 'healthy' | 'attention_required' | 'assistance_required'

/**
 * Primary map unit — device-centric (replaces user-only GrowerMapPin for future maps).
 */
export type PublicDittoDeviceMapPin = {
  deviceId: string
  ownerUserId: string
  model: string
  subtype: string | null
  friendlyName: string | null
  location: { lat: number; lng: number; region: string }
  status: DittoBotInventoryStatus
  isPublicOnMap: true
  activeProtocolId?: string
  activeProductionId?: string
}

/**
 * Aggregated grower summary — derived from devices, not primary map source.
 */
export type GrowerNetworkMemberSummary = {
  userId: string
  deviceCount: number
  publicDeviceCount: number
  activeProtocolCount: number
  healthStatus: GrowerHealthStatus
  approximateLocation?: {
    region: string
    lat?: number
    lng?: number
  }
}

/**
 * @deprecated R5.3 user-centric pin — use {@link PublicDittoDeviceMapPin} for future maps.
 * Kept for backward compatibility in tests and admin prototypes.
 */
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
