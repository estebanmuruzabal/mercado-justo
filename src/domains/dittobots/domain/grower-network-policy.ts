import { isSuperAdmin, type Role } from '@/domains/users/domain/roles'

import type {
  GrowerHealthSignals,
  GrowerHealthStatus,
  GrowerNetworkMemberSummary,
  PublicDittoDeviceMapPin,
} from './grower-network.types'

export type { GrowerHealthStatus } from './grower-network.types'

export type GrowerNetworkActor = {
  userId: string
  role: Role | null
}

/** Super Admin Panel — Ditto Growers section (design only in R5.3). */
export function canViewGrowerNetwork(actor: GrowerNetworkActor): boolean {
  return isSuperAdmin(actor.role)
}

export function canContactGrower(actor: GrowerNetworkActor): boolean {
  return isSuperAdmin(actor.role)
}

export function canSuspendGrowerAccess(actor: GrowerNetworkActor, growerUserId: string): boolean {
  void growerUserId
  return isSuperAdmin(actor.role)
}

/**
 * Derives aggregate health from future telemetry signals (pure, no I/O).
 * Priority: assistance > attention > healthy.
 */
export function deriveGrowerHealth(signals: GrowerHealthSignals): GrowerHealthStatus {
  const assistanceScore =
    signals.offlineDittoBotCount +
    signals.failingProtocolCount +
    signals.outOfRangeParameterCount

  if (assistanceScore > 0) {
    return 'assistance_required'
  }

  const attentionScore = signals.sensorsNotReportingCount + signals.repeatedErrorCount

  if (attentionScore > 0) {
    return 'attention_required'
  }

  return 'healthy'
}

/**
 * Aggregates grower network summaries from public device pins (R5.4 device-centric model).
 */
export function aggregateGrowerNetworkFromDevices(
  devices: PublicDittoDeviceMapPin[],
): GrowerNetworkMemberSummary[] {
  const byUser = new Map<string, PublicDittoDeviceMapPin[]>()

  for (const device of devices) {
    const existing = byUser.get(device.ownerUserId) ?? []
    existing.push(device)
    byUser.set(device.ownerUserId, existing)
  }

  return [...byUser.entries()].map(([userId, userDevices]) => {
    const publicDeviceCount = userDevices.length
    const primary = userDevices[0]

    return {
      userId,
      deviceCount: userDevices.length,
      publicDeviceCount,
      activeProtocolCount: userDevices.filter((d) => d.activeProtocolId).length,
      healthStatus: 'healthy' as GrowerHealthStatus,
      approximateLocation: primary
        ? {
            region: primary.location.region,
            lat: primary.location.lat,
            lng: primary.location.lng,
          }
        : undefined,
    }
  })
}
