import type { DittoBotOwnershipPort } from './ditto-bot-ownership-port'
import { supabaseDittoBotOwnershipRepository } from '../infrastructure/supabase-ditto-bot-ownership.repository'

let ownershipPort: DittoBotOwnershipPort = supabaseDittoBotOwnershipRepository

/** Test / DI hook. */
export function setDittoBotOwnershipPort(port: DittoBotOwnershipPort): void {
  ownershipPort = port
}

export function resetDittoBotOwnershipPort(): void {
  ownershipPort = supabaseDittoBotOwnershipRepository
}

export function getDittoBotOwnershipPort(): DittoBotOwnershipPort {
  return ownershipPort
}

/**
 * True when the user owns at least one registered DittoBot (any status).
 * Prefer {@link hasActiveDittoBot} for grower gating.
 */
export async function hasDittoBot(
  userId: string,
  port: DittoBotOwnershipPort = ownershipPort,
): Promise<boolean> {
  const count = await port.countByUserId(userId)
  return count > 0
}

/**
 * True when the user owns at least one activated DittoBot — canonical grower gate (R5.4).
 */
export async function hasActiveDittoBot(
  userId: string,
  port: DittoBotOwnershipPort = ownershipPort,
): Promise<boolean> {
  const count = await port.countActiveByUserId(userId)
  return count > 0
}

/**
 * Grower feature gate — requires activated DittoBot ownership.
 * Losing all bots suspends create/edit; existing protocols are retained (policy in publication BC).
 */
export async function canAccessGrowerFeatures(
  userId: string,
  port: DittoBotOwnershipPort = ownershipPort,
): Promise<boolean> {
  return hasActiveDittoBot(userId, port)
}

/** Semantic alias: operational membership in the Ditto Grower network. */
export async function isGrowerMember(
  userId: string,
  port: DittoBotOwnershipPort = ownershipPort,
): Promise<boolean> {
  return canAccessGrowerFeatures(userId, port)
}
