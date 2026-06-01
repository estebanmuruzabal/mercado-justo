import type { DittoBotInventoryUnitSummary } from './ditto-bot-inventory-unit'

/**
 * Port for DittoBot ownership queries (R5.4).
 *
 * Backed by `ditto_bot_inventory_unit` — activated units only for grower capability.
 */
export interface DittoBotOwnershipPort {
  countByUserId(userId: string): Promise<number>
  countActiveByUserId(userId: string): Promise<number>
  listActiveByUserId(userId: string): Promise<DittoBotInventoryUnitSummary[]>
}
