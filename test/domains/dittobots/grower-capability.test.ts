import { afterEach, describe, expect, it } from 'vitest'
import type { DittoBotOwnershipPort } from '@/domains/dittobots/domain/ditto-bot-ownership-port'
import {
  canAccessGrowerFeatures,
  hasActiveDittoBot,
  hasDittoBot,
  isGrowerMember,
  resetDittoBotOwnershipPort,
  setDittoBotOwnershipPort,
} from '@/domains/dittobots/domain/grower-capability'
import { stubDittoBotOwnershipPort } from '@/domains/dittobots/domain/ditto-bot-ownership.stub'

function mockPort(count: number, activeCount = count): DittoBotOwnershipPort {
  return {
    async countByUserId() {
      return count
    },
    async countActiveByUserId() {
      return activeCount
    },
    async listActiveByUserId() {
      return []
    },
  }
}

describe('grower-capability', () => {
  afterEach(() => {
    resetDittoBotOwnershipPort()
  })

  it('stub port returns no bots', async () => {
    expect(await hasDittoBot('user-1', stubDittoBotOwnershipPort)).toBe(false)
    expect(await hasActiveDittoBot('user-1', stubDittoBotOwnershipPort)).toBe(false)
    expect(await canAccessGrowerFeatures('user-1', stubDittoBotOwnershipPort)).toBe(false)
    expect(await isGrowerMember('user-1', stubDittoBotOwnershipPort)).toBe(false)
  })

  it('enables grower access when active count > 0', async () => {
    const port = mockPort(2, 1)
    setDittoBotOwnershipPort(port)

    expect(await hasActiveDittoBot('grower-1')).toBe(true)
    expect(await canAccessGrowerFeatures('grower-1')).toBe(true)
    expect(await isGrowerMember('grower-1')).toBe(true)
  })

  it('denies grower access when only non-active bots exist', async () => {
    const port = mockPort(1, 0)
    expect(await hasDittoBot('u', port)).toBe(true)
    expect(await hasActiveDittoBot('u', port)).toBe(false)
    expect(await canAccessGrowerFeatures('u', port)).toBe(false)
  })

  it('isGrowerMember is alias of canAccessGrowerFeatures', async () => {
    const port = mockPort(1, 1)
    const [member, access] = await Promise.all([
      isGrowerMember('u', port),
      canAccessGrowerFeatures('u', port),
    ])
    expect(member).toBe(access)
  })
})
