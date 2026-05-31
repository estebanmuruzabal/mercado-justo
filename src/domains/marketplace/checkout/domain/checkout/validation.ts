import { getPickupHubById } from './pickup-points.mock'
import type {
  CheckoutCartInput,
  CheckoutConfirmationInput,
  CheckoutFulfillmentInput,
  CheckoutPaymentInput,
  CheckoutSectionId,
  CheckoutSectionVisualState,
} from './types'

export function isDeliveryAddressComplete(location: CheckoutFulfillmentInput['location']): boolean {
  return (
    location.mode === 'delivery' &&
    location.address !== null &&
    location.latitude !== null &&
    location.longitude !== null &&
    location.city !== null &&
    location.province !== null
  )
}

export function isCartSectionValid(input: CheckoutCartInput): string[] {
  const errors: string[] = []
  if (input.itemCount === 0) {
    errors.push('Tu carrito está vacío.')
  }
  if (input.storeIds.length > 1) {
    errors.push('El checkout por ahora solo admite un vendedor por pedido.')
  }
  return errors
}

export function isDeliverySectionValid(input: CheckoutFulfillmentInput): string[] {
  const errors: string[] = []
  const { location, pickupSubOption, selectedPickupHubId, sellerHasAddress } = input

  if (location.mode === null) {
    errors.push('Elegí envío o retiro para continuar.')
    return errors
  }

  if (location.mode === 'delivery') {
    if (!isDeliveryAddressComplete(location)) {
      errors.push('Completá tu domicilio de entrega.')
    }
    return errors
  }

  if (location.mode === 'pickup') {
    if (!pickupSubOption) {
      errors.push('Elegí dónde vas a retirar el pedido.')
      return errors
    }
    if (pickupSubOption === 'hub') {
      if (!selectedPickupHubId || !getPickupHubById(selectedPickupHubId)) {
        errors.push('Elegí un punto de entrega.')
      }
    }
    if (pickupSubOption === 'seller' && !sellerHasAddress) {
      errors.push('El vendedor no tiene dirección de retiro configurada.')
    }
  }

  return errors
}

export function isPaymentSectionValid(input: CheckoutPaymentInput): string[] {
  const errors: string[] = []
  if (!input.paymentMethod || input.paymentMethod === 'card') {
    errors.push('Elegí un método de pago.')
  }
  return errors
}

export function isConfirmationSectionValid(input: CheckoutConfirmationInput): string[] {
  const errors: string[] = []
  if (!input.cartValid) {
    errors.push('Revisá los productos de tu pedido.')
  }
  if (!input.deliveryValid) {
    errors.push('Completá la forma de entrega.')
  }
  if (!input.paymentValid) {
    errors.push('Elegí un método de pago.')
  }
  return errors
}

/** Section is done when marked valid/collapsed and has no blocking errors. */
export function isSectionComplete(
  section: CheckoutSectionId,
  sectionStates: Record<CheckoutSectionId, CheckoutSectionVisualState>,
  sectionErrors: Record<CheckoutSectionId, string[]>,
): boolean {
  const state = sectionStates[section]
  const done = state === 'valid' || state === 'collapsed'
  return done && sectionErrors[section].length === 0
}

export function getNextSectionAfter(section: CheckoutSectionId): CheckoutSectionId | null {
  if (section === 'cart') return 'delivery'
  if (section === 'delivery') return 'payment'
  if (section === 'payment') return 'confirmation'
  return null
}

export function canOpenSection(
  section: CheckoutSectionId,
  sectionStates: Record<CheckoutSectionId, CheckoutSectionVisualState>,
  sectionErrors: Record<CheckoutSectionId, string[]>,
): boolean {
  if (section === 'cart') return true
  if (section === 'delivery') return isSectionComplete('cart', sectionStates, sectionErrors)
  if (section === 'payment') {
    return (
      isSectionComplete('cart', sectionStates, sectionErrors) &&
      isSectionComplete('delivery', sectionStates, sectionErrors)
    )
  }
  return (
    isSectionComplete('cart', sectionStates, sectionErrors) &&
    isSectionComplete('delivery', sectionStates, sectionErrors) &&
    isSectionComplete('payment', sectionStates, sectionErrors)
  )
}
