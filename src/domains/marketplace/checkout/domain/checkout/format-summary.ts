import type { CheckoutVendorFulfillmentDto } from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import { isDeliveryMethodCode } from '@/domains/logistics/domain/policies/checkout-fulfillment-policy'
import type { CheckoutPaymentInput, CheckoutVendorFulfillmentInput } from './types'

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
  input: CheckoutVendorFulfillmentInput & { vendors: CheckoutVendorFulfillmentDto[] },
): string | null {
  if (input.vendorIds.length === 0) return null

  const labels = input.vendorIds
    .map((vendorId) => {
      const vendor = input.vendors.find((item) => item.vendorId === vendorId)
      const selection = input.selections[vendorId]
      if (!vendor || !selection) return null

      const method = vendor.methods.find((item) => item.code === selection.methodCode)
      const window =
        isDeliveryMethodCode(selection.methodCode)
          ? vendor.deliveryWindows.find((item) => item.id === selection.windowId)
          : vendor.pickupWindows.find((item) => item.id === selection.windowId)

      if (!method) return null
      return `${vendor.vendorName}: ${method.label}${window ? ` · ${window.dayLabel}` : ''}`
    })
    .filter((value): value is string => value != null)

  if (labels.length === 0) return 'Elegí fulfillment por vendedor'
  if (labels.length === 1) return labels[0] ?? null
  return `${labels.length} vendedores configurados`
}

export function formatPaymentSectionSummary(input: CheckoutPaymentInput): string | null {
  if (!input.paymentMethod || input.paymentMethod === 'card') return null
  return PAYMENT_LABELS[input.paymentMethod]
}

export function formatConfirmationSectionSummary(hasNote: boolean): string | null {
  return hasNote ? 'Con nota para el vendedor' : 'Listo para confirmar'
}
