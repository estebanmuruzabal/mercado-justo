import { describe, expect, it } from 'vitest'

import type { CheckoutVendorFulfillmentDto } from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import {
  canOpenSection,
  isCartSectionValid,
  isConfirmationSectionValid,
  isDeliverySectionValid,
  isPaymentSectionValid,
  isSectionComplete,
} from './validation'
import type { CheckoutSectionId, CheckoutSectionVisualState } from './types'

const readyVendor: CheckoutVendorFulfillmentDto = {
  vendorId: '11111111-1111-1111-1111-111111111111',
  vendorName: 'Tienda Demo',
  itemCount: 1,
  defaultMethodCode: 'pickup_seller',
  methods: [
    {
      code: 'pickup_seller',
      label: 'Pickup en domicilio del vendedor',
      kind: 'pickup',
      provider: 'seller',
      isDefault: true,
    },
  ],
  pickupWindows: [
    {
      id: '22222222-2222-2222-2222-222222222222',
      label: 'Lunes 09:00-12:00',
      dayLabel: 'Lunes',
      timeRange: '09:00 — 12:00',
      kind: 'pickup',
    },
  ],
  deliveryWindows: [],
  preview: {
    vendorName: 'Tienda Demo',
    methods: [
      {
        code: 'pickup_seller',
        label: 'Pickup en domicilio del vendedor',
        kind: 'pickup',
        provider: 'seller',
        isDefault: true,
      },
    ],
    pickupWindows: [
      {
        id: '22222222-2222-2222-2222-222222222222',
        label: 'Lunes 09:00-12:00',
        dayLabel: 'Lunes',
        timeRange: '09:00 — 12:00',
        kind: 'pickup',
      },
    ],
    deliveryWindows: [],
    preferences: {
      autoUseStoreAddressForPickup: true,
      requireBuyerConfirmation: false,
      allowSameDayPickup: false,
      allowSameDayDelivery: false,
      minimumPreparationMinutes: null,
      pickupAddress: 'Calle Falsa 123',
      deliveryRadiusKm: null,
      deliveryAddress: null,
      notes: null,
    },
    isReadyForCheckout: true,
    readinessIssues: [],
  },
}

describe('checkout validation', () => {
  it('requires vendor fulfillment selection', () => {
    const errors = isDeliverySectionValid({
      vendorIds: [readyVendor.vendorId],
      selections: {},
      deliveryAddress: null,
      vendors: [readyVendor],
    })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('accepts valid pickup selection', () => {
    const errors = isDeliverySectionValid({
      vendorIds: [readyVendor.vendorId],
      selections: {
        [readyVendor.vendorId]: {
          vendorId: readyVendor.vendorId,
          methodCode: 'pickup_seller',
          windowId: '22222222-2222-2222-2222-222222222222',
          scheduledDate: '2026-06-16',
          startTime: '09:00',
          endTime: '12:00',
          pickupAddress: 'Calle Falsa 123',
          deliveryAddress: null,
        },
      },
      deliveryAddress: null,
      vendors: [readyVendor],
    })
    expect(errors).toHaveLength(0)
  })

  it('rejects card payment method', () => {
    expect(isPaymentSectionValid({ paymentMethod: 'card' }).length).toBeGreaterThan(0)
    expect(isPaymentSectionValid({ paymentMethod: 'cash' })).toHaveLength(0)
  })

  it('requires items in cart section', () => {
    const errors = isCartSectionValid({
      itemCount: 0,
      storeIds: [],
    })
    expect(errors.some((e) => e.includes('vacío'))).toBe(true)
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
