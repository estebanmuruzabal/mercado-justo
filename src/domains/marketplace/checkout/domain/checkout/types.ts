import type { FulfillmentMethodCode } from '@/domains/logistics/domain/types'
import type { CheckoutVendorFulfillmentSelectionDto } from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import type { LocationMode } from '@/shared/maps/location/location-types'

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

export type VendorFulfillmentDraft = CheckoutVendorFulfillmentSelectionDto

export type CheckoutVendorFulfillmentInput = {
  vendorIds: string[]
  selections: Record<string, CheckoutVendorFulfillmentSelectionDto | undefined>
  deliveryAddress: string | null
}

export type CheckoutMetadata = {
  fulfillments: CheckoutVendorFulfillmentSelectionDto[]
  paymentMethod: PaymentMethodId
  note?: string
  couponCode?: string
}

export type LocationSnapshot = {
  mode: LocationMode | null
  address: string | null
  latitude: number | null
  longitude: number | null
  city: string | null
  province: string | null
}

/** @deprecated Legacy location-based fulfillment input. Prefer CheckoutVendorFulfillmentInput. */
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

export type { FulfillmentMethodCode }
