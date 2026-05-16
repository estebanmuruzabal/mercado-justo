import type { ListingType } from '@/lib/listing'

export type CartListingType = ListingType

export type CartItemId = string

export type CartItem = {
  id: CartItemId
  listingType: CartListingType
  listingId: string

  title: string
  image: string

  quantity: number
  unitPrice: number
}

export function calcItemSubtotal(item: CartItem) {
  return item.quantity * item.unitPrice
}

export function calcCartTotals(items: CartItem[]) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + calcItemSubtotal(item), 0)
  return { itemCount, totalPrice }
}

export function makeCartItemId(listingType: CartListingType, listingId: string) {
  return `${listingType}:${listingId}`
}

