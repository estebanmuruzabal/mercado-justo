export const LISTING_TYPES = [
  'product',
  'property',
  'experience',
  'service',
] as const

export type ListingType = (typeof LISTING_TYPES)[number]

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  product: 'Productos',
  property: 'Propiedades',
  experience: 'Experiencias',
  service: 'Servicios',
}

export function getListingTypeLabel(listingType: ListingType) {
  return LISTING_TYPE_LABELS[listingType]
}

// Template / dynamic field types (re-exported for backwards compatibility)
export type {
  FieldType,
  TemplateField,
  TemplateSection,
  TemplateDef,
  CharacteristicValue,
  CharacteristicMap,
  JsonValue,
} from './product'

// -----------------------------
// Cart models + persistence TTL
// -----------------------------

export type CartItemId = string

export type CartItem = {
  id: CartItemId
  listingType: ListingType
  listingId: string

  // Seller context (vendor) so cart operations can be routed later.
  storeId: string

  title: string
  image: string

  quantity: number
  unitPrice: number
}

export type CartState = {
  items: CartItem[]
}

export type CartPersistenceV1 = {
  state: CartState
  lastUpdatedAt: number
  // Bump this when the CartItem shape changes.
  version: 2
}

export const CART_STORAGE_KEY = 'mercado-justo.cart.v2' as const
export const CART_TTL_MS = 48 * 60 * 60 * 1000

export function makeCartItemId(listingType: ListingType, listingId: string): CartItemId {
  return `${listingType}:${listingId}`
}

export function calcItemSubtotal(item: CartItem) {
  return item.quantity * item.unitPrice
}

export function calcCartTotals(items: CartItem[]) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + calcItemSubtotal(item), 0)
  return { itemCount, totalPrice }
}

