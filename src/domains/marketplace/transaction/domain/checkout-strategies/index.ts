import type { TransactionKind } from '../transaction-kind'

export type CheckoutStepId =
  | 'cart'
  | 'schedule'
  | 'delivery'
  | 'payment'
  | 'confirmation'

export type CheckoutStrategy = {
  kind: TransactionKind
  steps: readonly CheckoutStepId[]
  requiresLogistics: boolean
  requiresFinance: boolean
}

export const CHECKOUT_STRATEGIES: Record<TransactionKind, CheckoutStrategy> = {
  purchase: {
    kind: 'purchase',
    steps: ['cart', 'delivery', 'payment', 'confirmation'],
    requiresLogistics: true,
    requiresFinance: true,
  },
  booking: {
    kind: 'booking',
    steps: ['cart', 'schedule', 'payment', 'confirmation'],
    requiresLogistics: false,
    requiresFinance: true,
  },
  contract: {
    kind: 'contract',
    steps: ['cart', 'confirmation'],
    requiresLogistics: false,
    requiresFinance: false,
  },
  enrollment: {
    kind: 'enrollment',
    steps: ['cart', 'confirmation'],
    requiresLogistics: false,
    requiresFinance: false,
  },
  rental: {
    kind: 'rental',
    steps: ['cart', 'schedule', 'payment', 'confirmation'],
    requiresLogistics: true,
    requiresFinance: true,
  },
  donation: {
    kind: 'donation',
    steps: ['cart', 'payment', 'confirmation'],
    requiresLogistics: false,
    requiresFinance: true,
  },
  exchange: {
    kind: 'exchange',
    steps: ['cart', 'confirmation'],
    requiresLogistics: false,
    requiresFinance: false,
  },
}

export function getCheckoutStrategy(kind: TransactionKind): CheckoutStrategy {
  return CHECKOUT_STRATEGIES[kind]
}

export function inferTransactionKindFromPublicationTypes(
  publicationTypes: string[],
): TransactionKind {
  if (publicationTypes.some((t) => t === 'experience' || t === 'event')) {
    return 'booking'
  }
  if (publicationTypes.some((t) => t === 'job')) {
    return 'enrollment'
  }
  return 'purchase'
}
