export type OwnerType = 'user' | 'store' | 'org'

export type OwnerRef = {
  ownerType: OwnerType
  ownerId: string
}

export function storeOwner(storeId: string): OwnerRef {
  return { ownerType: 'store', ownerId: storeId }
}

export function userOwner(userId: string): OwnerRef {
  return { ownerType: 'user', ownerId: userId }
}
