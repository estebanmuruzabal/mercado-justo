import type { DittoBotOwnershipPort } from './ditto-bot-ownership-port'

/** Test fallback when real port is not wired. */
export const stubDittoBotOwnershipPort: DittoBotOwnershipPort = {
  async countByUserId(userId: string): Promise<number> {
    void userId
    return 0
  },
  async countActiveByUserId(userId: string): Promise<number> {
    void userId
    return 0
  },
  async listActiveByUserId(userId: string) {
    void userId
    return []
  },
}
