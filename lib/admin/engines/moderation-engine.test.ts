import { describe, expect, it } from 'vitest'

import {
  canModerateListing,
  canTransitionReport,
  isPubliclyVisible,
  isReportOpen,
  recommendFromSignal,
  noopModerationProvider,
} from '@/lib/admin/engines/moderation-engine'

describe('listing moderation', () => {
  it('allows valid transitions', () => {
    expect(canModerateListing('pending', 'approved')).toBe(true)
    expect(canModerateListing('approved', 'hidden')).toBe(true)
  })

  it('rejects no-op transitions', () => {
    expect(canModerateListing('approved', 'approved')).toBe(false)
  })

  it('computes public visibility', () => {
    expect(isPubliclyVisible('published', 'approved')).toBe(true)
    expect(isPubliclyVisible('published', 'hidden')).toBe(false)
    expect(isPubliclyVisible('draft', 'approved')).toBe(false)
  })
})

describe('report queue', () => {
  it('allows valid transitions', () => {
    expect(canTransitionReport('open', 'reviewing')).toBe(true)
    expect(canTransitionReport('reviewing', 'resolved')).toBe(true)
  })

  it('locks resolved reports', () => {
    expect(canTransitionReport('resolved', 'open')).toBe(false)
  })

  it('detects open statuses', () => {
    expect(isReportOpen('open')).toBe(true)
    expect(isReportOpen('reviewing')).toBe(true)
    expect(isReportOpen('resolved')).toBe(false)
  })
})

describe('AI moderation seam', () => {
  it('maps signal scores to actions', () => {
    expect(recommendFromSignal({ score: 0.9, reasons: [] }).action).toBe('reject')
    expect(recommendFromSignal({ score: 0.6, reasons: [] }).action).toBe('review')
    expect(recommendFromSignal({ score: 0.1, reasons: [] }).action).toBe('approve')
  })

  it('noop provider never flags', async () => {
    const signal = await noopModerationProvider.evaluate({ title: 'x' })
    expect(signal.score).toBe(0)
  })
})
