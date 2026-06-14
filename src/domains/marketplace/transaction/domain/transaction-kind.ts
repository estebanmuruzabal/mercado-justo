export const TRANSACTION_KINDS = [
  'purchase',
  'booking',
  'contract',
  'enrollment',
  'rental',
  'donation',
  'exchange',
] as const

export type TransactionKind = (typeof TRANSACTION_KINDS)[number]

export const TRANSACTION_STATUSES = [
  'draft',
  'pending_payment',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'refunded',
] as const

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number]

export const LINE_KINDS = ['offer_variant', 'publication', 'custom'] as const

export type TransactionLineKind = (typeof LINE_KINDS)[number]

export const FULFILLMENT_HINTS = ['ship', 'pickup', 'digital', 'onsite', 'none'] as const

export type FulfillmentHint = (typeof FULFILLMENT_HINTS)[number]

/** Maps legacy order row to transaction kind. */
export function transactionKindFromLegacyOrder(): TransactionKind {
  return 'purchase'
}
