/**
 * Port for DittoBot ownership queries (R5.3 design).
 *
 * Future: serial / activation / pairing validation backed by persistence.
 * R5.3 ships a stub returning zero bots until pairing backend exists (R5.5+).
 */
export interface DittoBotOwnershipPort {
  countByUserId(userId: string): Promise<number>
}
