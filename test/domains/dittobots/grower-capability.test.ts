import { afterEach, describe, expect, it } from 'vitest'
import type { DittoBotOwnershipPort } from '@/domains/dittobots/domain/ditto-bot-ownership-port'
import {
  canAccessGrowerFeatures,
  hasDittoBot,
  isGrowerMember,
  resetDittoBotOwnershipPort,
  setDittoBotOwnershipPort,
} from '@/domains/dittobots/domain/grower-capability'
import { stubDittoBotOwnershipPort } from '@/domains/dittobots/domain/ditto-bot-ownership.stub'

function mockPort(count: number): DittoBotOwnershipPort {
  return {
    async countByUserId() {
      return count
    },
  }
}

describe('grower-capability', () => {
  afterEach(() => {
    resetDittoBotOwnershipPort()
  })

  it('stub port returns no bots', async () => {
    expect(await hasDittoBot('user-1', stubDittoBotOwnershipPort)).toBe(false)
    expect(await canAccessGrowerFeatures('user-1', stubDittoBotOwnershipPort)).toBe(false)
    expect(await isGrowerMember('user-1', stubDittoBotOwnershipPort)).toBe(false)
  })

  it('enables grower access when count > 0', async () => {
    const port = mockPort(2)
    setDittoBotOwnershipPort(port)

    expect(await hasDittoBot('grower-1')).toBe(true)
    expect(await canAccessGrowerFeatures('grower-1')).toBe(true)
    expect(await isGrowerMember('grower-1')).toBe(true)
  })

  it('isGrowerMember is alias of canAccessGrowerFeatures', async () => {
    const port = mockPort(1)
    const [member, access] = await Promise.all([
      isGrowerMember('u', port),
      canAccessGrowerFeatures('u', port),
    ])
    expect(member).toBe(access)
  })
})
