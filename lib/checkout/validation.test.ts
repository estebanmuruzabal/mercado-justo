import { describe, expect, it } from 'vitest'

import {
  canOpenSection,
  isCartSectionValid,
  isConfirmationSectionValid,
  isDeliverySectionValid,
  isPaymentSectionValid,
  isSectionComplete,
} from './validation'
import type { CheckoutSectionId, CheckoutSectionVisualState } from './types'

describe('checkout validation', () => {
  it('requires location mode for delivery section', () => {
    const errors = isDeliverySectionValid({
      location: {
        mode: null,
        address: null,
        latitude: null,
        longitude: null,
        city: null,
        province: null,
      },
      pickupSubOption: null,
      selectedPickupHubId: null,
      sellerHasAddress: true,
    })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('validates pickup hub selection', () => {
    const errors = isDeliverySectionValid({
      location: {
        mode: 'pickup',
        address: null,
        latitude: null,
        longitude: null,
        city: null,
        province: null,
      },
      pickupSubOption: 'hub',
      selectedPickupHubId: 'ditto-van-centro',
      sellerHasAddress: true,
    })
    expect(errors).toHaveLength(0)
  })

  it('rejects card payment method', () => {
    expect(isPaymentSectionValid({ paymentMethod: 'card' }).length).toBeGreaterThan(0)
    expect(isPaymentSectionValid({ paymentMethod: 'cash' })).toHaveLength(0)
  })

  it('requires single vendor in cart section', () => {
    const errors = isCartSectionValid({
      itemCount: 2,
      storeIds: ['a', 'b'],
    })
    expect(errors.some((e) => e.includes('vendedor'))).toBe(true)
  })

  it('treats collapsed state as complete for canOpenSection', () => {
    const states: Record<CheckoutSectionId, CheckoutSectionVisualState> = {
      cart: 'collapsed',
      delivery: 'editing',
      payment: 'collapsed',
      confirmation: 'collapsed',
    }
    const errors: Record<CheckoutSectionId, string[]> = {
      cart: [],
      delivery: [],
      payment: [],
      confirmation: [],
    }
    expect(isSectionComplete('cart', states, errors)).toBe(true)
    expect(canOpenSection('delivery', states, errors)).toBe(true)
  })

  it('requires prior sections for confirmation', () => {
    const errors = isConfirmationSectionValid({
      deliveryValid: false,
      paymentValid: true,
      cartValid: true,
    })
    expect(errors.some((e) => e.includes('entrega'))).toBe(true)
  })
})
