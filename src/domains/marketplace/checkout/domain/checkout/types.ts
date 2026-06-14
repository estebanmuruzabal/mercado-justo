import type { LocationMode, LocationSelection } from '@/shared/maps/location/location-types'

/** Alias: homepage/header receive mode (`useLocationStore.mode`). */
export type DeliveryMethod = LocationMode

export type CheckoutSectionId = 'cart' | 'delivery' | 'payment' | 'confirmation'

export const CHECKOUT_SECTIONS: CheckoutSectionId[] = [
  'cart',
  'delivery',
  'payment',
  'confirmation',
]

export type CheckoutSectionVisualState = 'collapsed' | 'editing' | 'valid' | 'invalid'

export type PickupSubOption = 'hub' | 'seller'

export type PaymentMethodId = 'cash' | 'transfer' | 'card'

export type PickupHub = {
  id: string
  name: string
  address: string
  city: string
  province: string
  latitude: number
  longitude: number
  scheduleLabel: string
  costLabel: string
  kind: 'ditto_van' | 'plaza' | 'locker' | 'hub'
}

export type VendorFulfillmentDraft = {
  storeId: string
  method: DeliveryMethod
  pickupSubOption?: PickupSubOption
  hubId?: string
  deliveryAddress?: LocationSelection
  timeWindowId?: string
  deliveryFeeCents?: number
}

/** Future: sent to server when order schema supports fulfillment metadata. */
export type CheckoutMetadata = {
  fulfillment: VendorFulfillmentDraft
  paymentMethod: PaymentMethodId
  note?: string
  couponCode?: string
  scheduledWindowId?: string
}

export type LocationSnapshot = {
  mode: LocationMode | null
  address: string | null
  latitude: number | null
  longitude: number | null
  city: string | null
  province: string | null
}

export type CheckoutFulfillmentInput = {
  location: LocationSnapshot
  pickupSubOption: PickupSubOption | null
  selectedPickupHubId: string | null
  sellerHasAddress: boolean
}

export type CheckoutPaymentInput = {
  paymentMethod: PaymentMethodId | null
}

export type CheckoutCartInput = {
  itemCount: number
  storeIds: string[]
}

export type CheckoutConfirmationInput = {
  deliveryValid: boolean
  paymentValid: boolean
  cartValid: boolean
}
