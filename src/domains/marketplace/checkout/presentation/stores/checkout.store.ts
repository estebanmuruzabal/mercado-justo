'use client'

import { create } from 'zustand'

import type {
  CheckoutSectionId,
  CheckoutSectionVisualState,
  PaymentMethodId,
  PickupSubOption,
  VendorFulfillmentDraft,
} from '@/domains/marketplace/checkout/domain/checkout/types'

const INITIAL_SECTION_STATE: Record<CheckoutSectionId, CheckoutSectionVisualState> = {
  cart: 'editing',
  delivery: 'collapsed',
  payment: 'collapsed',
  confirmation: 'collapsed',
}

type CheckoutState = {
  activeSection: CheckoutSectionId
  sectionState: Record<CheckoutSectionId, CheckoutSectionVisualState>
  sectionErrors: Record<CheckoutSectionId, string[]>

  pickupSubOption: PickupSubOption | null
  selectedPickupHubId: string | null
  paymentMethod: PaymentMethodId | null
  note: string
  couponCode: string | null
  scheduledWindowId: string | null
  vendorFulfillment: Record<string, VendorFulfillmentDraft>

  initialized: boolean

  setActiveSection: (section: CheckoutSectionId) => void
  setSectionState: (section: CheckoutSectionId, state: CheckoutSectionVisualState) => void
  setSectionErrors: (section: CheckoutSectionId, errors: string[]) => void
  setPickupSubOption: (option: PickupSubOption | null) => void
  setSelectedPickupHubId: (id: string | null) => void
  setPaymentMethod: (method: PaymentMethodId | null) => void
  setNote: (note: string) => void
  setInitialized: (value: boolean) => void
  resetCheckoutUi: () => void
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  activeSection: 'cart',
  sectionState: { ...INITIAL_SECTION_STATE },
  sectionErrors: {
    cart: [],
    delivery: [],
    payment: [],
    confirmation: [],
  },

  pickupSubOption: null,
  selectedPickupHubId: null,
  paymentMethod: null,
  note: '',
  couponCode: null,
  scheduledWindowId: null,
  vendorFulfillment: {},

  initialized: false,

  setActiveSection: (section) => set({ activeSection: section }),
  setSectionState: (section, state) =>
    set((prev) => ({
      sectionState: { ...prev.sectionState, [section]: state },
    })),
  setSectionErrors: (section, errors) =>
    set((prev) => ({
      sectionErrors: { ...prev.sectionErrors, [section]: errors },
    })),
  setPickupSubOption: (option) =>
    set((prev) => ({
      pickupSubOption: option,
      selectedPickupHubId: option === 'seller' ? null : prev.selectedPickupHubId,
    })),
  setSelectedPickupHubId: (id) => set({ selectedPickupHubId: id }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setNote: (note) => set({ note }),
  setInitialized: (value) => set({ initialized: value }),
  resetCheckoutUi: () =>
    set({
      activeSection: 'cart',
      sectionState: { ...INITIAL_SECTION_STATE },
      sectionErrors: { cart: [], delivery: [], payment: [], confirmation: [] },
      pickupSubOption: null,
      selectedPickupHubId: null,
      paymentMethod: null,
      initialized: false,
    }),
}))
