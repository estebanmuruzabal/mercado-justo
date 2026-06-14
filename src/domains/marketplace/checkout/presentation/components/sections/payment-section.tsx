'use client'

import { PaymentMethodCards } from '../payment/payment-method-cards'
import type { PaymentMethodId } from '@/domains/marketplace/checkout/domain/checkout/types'

export function PaymentSection({ onSelect }: { onSelect: (method: PaymentMethodId) => void }) {
  return <PaymentMethodCards onSelect={onSelect} />
}
