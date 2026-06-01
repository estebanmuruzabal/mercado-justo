import type { DittoBotOwnershipPort } from '../domain/ditto-bot-ownership-port'
import {
  countActiveUnitsByOwner,
  countUnitsByOwner,
  listActiveUnitsByOwner,
} from './ditto-bot-inventory.repository'

export const supabaseDittoBotOwnershipRepository: DittoBotOwnershipPort = {
  countByUserId: countUnitsByOwner,
  countActiveByUserId: countActiveUnitsByOwner,
  listActiveByUserId: listActiveUnitsByOwner,
}
