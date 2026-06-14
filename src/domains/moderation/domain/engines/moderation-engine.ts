import {
  type ListingModerationStatus,
  type ReportStatus,
} from '@/domains/logistics/domain/types'

/**
 * Moderation engine — decision rules + state transitions for listings and the
 * report queue. Pure and side-effect free.
 *
 * The `ModerationProvider` interface is the seam for FUTURE AI moderation: a
 * provider scores content; this engine maps the signal to a recommended action.
 * Phase 1 ships a no-op heuristic provider so the wiring exists end to end.
 */

// ——— Listing moderation transitions ———
const LISTING_TRANSITIONS: Record<
  ListingModerationStatus,
  readonly ListingModerationStatus[]
> = {
  pending: ['approved', 'rejected', 'hidden'],
  approved: ['hidden', 'rejected'],
  rejected: ['approved', 'hidden'],
  hidden: ['approved', 'rejected'],
}

export function canModerateListing(
  from: ListingModerationStatus,
  to: ListingModerationStatus,
): boolean {
  if (from === to) return false
  return (LISTING_TRANSITIONS[from] ?? []).includes(to)
}

export function assertListingModeration(
  from: ListingModerationStatus,
  to: ListingModerationStatus,
): ListingModerationStatus {
  if (!canModerateListing(from, to)) {
    throw new Error(`Invalid listing moderation transition: ${from} -> ${to}`)
  }
  return to
}

/** A listing is publicly visible only when published AND not rejected/hidden. */
export function isPubliclyVisible(
  publishStatus: string,
  moderationStatus: ListingModerationStatus,
): boolean {
  return publishStatus === 'published' && (moderationStatus === 'approved' || moderationStatus === 'pending')
}

// ——— Report queue transitions ———
const REPORT_TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> = {
  open: ['reviewing', 'resolved', 'dismissed'],
  reviewing: ['resolved', 'dismissed', 'open'],
  resolved: [],
  dismissed: ['open'],
}

export function canTransitionReport(from: ReportStatus, to: ReportStatus): boolean {
  if (from === to) return false
  return (REPORT_TRANSITIONS[from] ?? []).includes(to)
}

export function isReportOpen(status: ReportStatus): boolean {
  return status === 'open' || status === 'reviewing'
}

// ——— AI-moderation seam (Phase 2) ———
export type ModerationSignal = {
  /** 0..1 confidence the content violates policy. */
  score: number
  reasons: string[]
}

export type ModeratableContent = {
  title?: string | null
  description?: string | null
  imageUrls?: string[]
}

export interface ModerationProvider {
  readonly id: string
  evaluate(content: ModeratableContent): Promise<ModerationSignal>
}

export type ModerationRecommendation = {
  action: 'approve' | 'reject' | 'review'
  signal: ModerationSignal
}

/** Map a provider signal to a recommended action via thresholds. */
export function recommendFromSignal(
  signal: ModerationSignal,
  thresholds = { reject: 0.85, review: 0.5 },
): ModerationRecommendation {
  if (signal.score >= thresholds.reject) return { action: 'reject', signal }
  if (signal.score >= thresholds.review) return { action: 'review', signal }
  return { action: 'approve', signal }
}

/** Default Phase 1 provider: never flags (placeholder until a real model is wired). */
export const noopModerationProvider: ModerationProvider = {
  id: 'noop',
  async evaluate() {
    return { score: 0, reasons: [] }
  },
}
