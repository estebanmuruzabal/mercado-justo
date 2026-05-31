import type { DittoBotOwnershipPort } from './ditto-bot-ownership-port'

/** Default R5.3 stub — no registered bots until pairing ships. */
export const stubDittoBotOwnershipPort: DittoBotOwnershipPort = {
  async countByUserId(userId: string): Promise<number> {
    void userId
    return 0
  },
}
