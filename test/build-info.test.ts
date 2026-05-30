import { describe, expect, it } from 'vitest'

import { formatBuildTime } from '@/lib/build-info'

describe('formatBuildTime', () => {
  it('formats ISO timestamps in UTC', () => {
    const formatted = formatBuildTime('2026-05-30T17:30:00.000Z', 'en-US')
    expect(formatted).toContain('UTC')
    expect(formatted).toMatch(/30/)
  })
})
