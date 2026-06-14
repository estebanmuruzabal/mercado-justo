import { getPickupHubById } from './pickup-points.mock'
import type { CheckoutFulfillmentInput, CheckoutPaymentInput } from './types'

const PAYMENT_LABELS: Record<'cash' | 'transfer' | 'card', string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
}

export function formatCartSectionSummary(itemCount: number, subtotal: number): string | null {
  if (itemCount === 0) return null
  return `${itemCount} artículo${itemCount === 1 ? '' : 's'} · $${subtotal}`
}

export function formatDeliverySectionSummary(
  input: CheckoutFulfillmentInput,
  sellerName?: string | null,
): string | null {
  const { location, pickupSubOption, selectedPickupHubId } = input

  if (location.mode === null) return null

  if (location.mode === 'delivery' && location.address) {
    const cityPart =
      location.city && location.province
        ? ` - ${location.city}, ${location.province}`
        : location.city
          ? ` - ${location.city}`
          : ''
    return `Envío a ${location.address}${cityPart}`
  }

  if (location.mode === 'pickup') {
    if (pickupSubOption === 'hub' && selectedPickupHubId) {
      const hub = getPickupHubById(selectedPickupHubId)
      if (hub) return `Retiro en ${hub.name}`
    }
    if (pickupSubOption === 'seller') {
      return sellerName ? `Retiro en ${sellerName}` : 'Retiro en dirección del vendedor'
    }
    return 'Retiro'
  }

  return null
}

export function formatPaymentSectionSummary(input: CheckoutPaymentInput): string | null {
  if (!input.paymentMethod || input.paymentMethod === 'card') return null
  return PAYMENT_LABELS[input.paymentMethod]
}

export function formatConfirmationSectionSummary(hasNote: boolean): string | null {
  return hasNote ? 'Con nota para el vendedor' : 'Listo para confirmar'
}
