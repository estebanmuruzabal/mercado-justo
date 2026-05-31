export const LIFECYCLE_STATES = [
  'draft',
  'pending_review',
  'published',
  'suspended',
  'archived',
  'deleted',
] as const

export type LifecycleState = (typeof LIFECYCLE_STATES)[number]

/** Maps legacy listing.status + moderation to unified lifecycle. */
export function lifecycleFromListingRow(row: {
  status: string
  moderation_status: string
}): LifecycleState {
  if (row.moderation_status === 'hidden' || row.moderation_status === 'rejected') {
    return 'suspended'
  }
  if (row.status === 'published' && row.moderation_status === 'approved') {
    return 'published'
  }
  if (row.status === 'published') {
    return 'pending_review'
  }
  return 'draft'
}

const TRANSITIONS: Record<LifecycleState, readonly LifecycleState[]> = {
  draft: ['pending_review', 'published', 'deleted'],
  pending_review: ['published', 'suspended', 'draft'],
  published: ['archived', 'suspended', 'draft'],
  suspended: ['published', 'archived', 'deleted'],
  archived: ['published', 'deleted'],
  deleted: [],
}

export function canTransition(from: LifecycleState, to: LifecycleState): boolean {
  return TRANSITIONS[from].includes(to)
}

export function assertTransition(from: LifecycleState, to: LifecycleState): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid lifecycle transition: ${from} → ${to}`)
  }
}
