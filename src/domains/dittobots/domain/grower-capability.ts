import type { DittoBotOwnershipPort } from './ditto-bot-ownership-port'
import { stubDittoBotOwnershipPort } from './ditto-bot-ownership.stub'

let ownershipPort: DittoBotOwnershipPort = stubDittoBotOwnershipPort

/** Test / future DI hook — does not affect production until pairing wires a real port. */
export function setDittoBotOwnershipPort(port: DittoBotOwnershipPort): void {
  ownershipPort = port
}

export function resetDittoBotOwnershipPort(): void {
  ownershipPort = stubDittoBotOwnershipPort
}

export function getDittoBotOwnershipPort(): DittoBotOwnershipPort {
  return ownershipPort
}

/**
 * True when the user owns at least one registered DittoBot.
 * Grower membership is operational (red Ditto), not a manual role assignment.
 */
export async function hasDittoBot(
  userId: string,
  port: DittoBotOwnershipPort = ownershipPort,
): Promise<boolean> {
  const count = await port.countByUserId(userId)
  return count > 0
}

/**
 * Grower feature gate — requires DittoBot ownership.
 * Losing all bots suspends create/edit; existing protocols are retained (policy in publication BC).
 */
export async function canAccessGrowerFeatures(
  userId: string,
  port: DittoBotOwnershipPort = ownershipPort,
): Promise<boolean> {
  return hasDittoBot(userId, port)
}

/** Semantic alias: operational membership in the Ditto Grower network. */
export async function isGrowerMember(
  userId: string,
  port: DittoBotOwnershipPort = ownershipPort,
): Promise<boolean> {
  return canAccessGrowerFeatures(userId, port)
}
