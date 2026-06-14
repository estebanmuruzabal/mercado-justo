import type { OwnerRef } from '@/domains/marketplace/publication/domain/value-objects/owner-ref'
import type { Publication } from '@/domains/marketplace/publication/domain/entities/publication'

export type OwnershipActor = {
  userId: string
  storeId?: string | null
}

export function resolveStoreOperator(actor: OwnershipActor): string | null {
  return actor.storeId ?? actor.userId
}

export function isStoreOwner(actor: OwnershipActor, owner: OwnerRef): boolean {
  return owner.ownerType === 'store' && owner.ownerId === actor.userId
}

export function isUserOwner(actor: OwnershipActor, owner: OwnerRef): boolean {
  return owner.ownerType === 'user' && owner.ownerId === actor.userId
}

export function canEditPublication(actor: OwnershipActor, publication: Publication): boolean {
  if (publication.owner.ownerType === 'org') return false
  return isStoreOwner(actor, publication.owner) || isUserOwner(actor, publication.owner)
}

export function canPublishPublication(actor: OwnershipActor, publication: Publication): boolean {
  return canEditPublication(actor, publication)
}

export function ownerRefFromPublicationRow(row: {
  owner_type: string
  owner_id: string
  store_id?: string
}): OwnerRef {
  if (row.owner_type === 'user') {
    return { ownerType: 'user', ownerId: row.owner_id }
  }
  if (row.owner_type === 'org') {
    return { ownerType: 'org', ownerId: row.owner_id }
  }
  return { ownerType: 'store', ownerId: row.owner_id ?? row.store_id! }
}

export function ownerRefFromListingRow(storeId: string): OwnerRef {
  return { ownerType: 'store', ownerId: storeId }
}
