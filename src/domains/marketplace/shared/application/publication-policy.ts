import { hasCapability } from '@/domains/marketplace/shared/domain/capabilities'
import {
  getPublicationTypeDefinition,
  isPersistablePublicationType,
} from '@/domains/marketplace/shared/domain/publication-type-registry'
import {
  assertTransition,
  type LifecycleState,
} from '@/domains/marketplace/shared/domain/lifecycle-state'
import type { Visibility } from '@/domains/marketplace/shared/domain/visibility'

export function canCreatePublication(publicationType: string): boolean {
  const def = getPublicationTypeDefinition(publicationType)
  return def?.isActive === true
}

export function canPersistPublicationType(publicationType: string): boolean {
  return isPersistablePublicationType(publicationType)
}

export function canPublish(params: {
  publicationType: string
  lifecycle: LifecycleState
  moderationStatus: string
  visibility: Visibility
}): boolean {
  const def = getPublicationTypeDefinition(params.publicationType)
  if (!def?.isActive) return false
  if (params.moderationStatus === 'rejected' || params.moderationStatus === 'hidden') {
    return false
  }
  return params.lifecycle === 'draft' || params.lifecycle === 'pending_review'
}

export function transitionLifecycle(from: LifecycleState, to: LifecycleState): LifecycleState {
  assertTransition(from, to)
  return to
}

export function isTransactableType(publicationType: string): boolean {
  const def = getPublicationTypeDefinition(publicationType)
  if (!def) return false
  return hasCapability(def.capabilities, 'transactable')
}

export function requiresModerationBeforePublic(): boolean {
  return true
}
