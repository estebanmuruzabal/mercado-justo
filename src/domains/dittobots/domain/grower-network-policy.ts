import { isSuperAdmin, type Role } from '@/domains/users/domain/roles'

import type { GrowerHealthSignals, GrowerHealthStatus } from './grower-network.types'

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
