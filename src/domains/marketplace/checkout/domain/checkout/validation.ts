import { validateCheckoutFulfillmentPayload } from '@/domains/logistics/domain/policies/checkout-fulfillment-policy'
import type { CheckoutVendorFulfillmentDto } from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import type {
  CheckoutCartInput,
  CheckoutConfirmationInput,
  CheckoutPaymentInput,
  CheckoutSectionId,
  CheckoutSectionVisualState,
  CheckoutVendorFulfillmentInput,
} from './types'

export function isCartSectionValid(input: CheckoutCartInput): string[] {
  const errors: string[] = []
  if (input.itemCount === 0) {
    errors.push('Tu carrito está vacío.')
  }
  return errors
}

export function isDeliverySectionValid(input: CheckoutVendorFulfillmentInput & {
  vendors: CheckoutVendorFulfillmentDto[]
}): string[] {
  if (input.vendorIds.length === 0) {
    return ['Tu carrito está vacío.']
  }

  return validateCheckoutFulfillmentPayload({
    vendors: input.vendors,
    selections: input.selections,
    deliveryAddress: input.deliveryAddress,
  })
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
