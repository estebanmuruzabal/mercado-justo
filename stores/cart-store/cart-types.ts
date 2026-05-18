import type { CartItem, CartItemId, CartState, CartPersistenceV1, ListingType } from '@/lib/listing'

export function calcItemSubtotal(item: CartItem) {
  return item.quantity * item.unitPrice
}

export function calcCartTotals(items: CartItem[]) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + calcItemSubtotal(item), 0)
  return { itemCount, totalPrice }
}

export type CartListingType = ListingType

export { makeCartItemId } from '@/lib/listing'
export type { CartItem, CartItemId, CartState, CartPersistenceV1 }

