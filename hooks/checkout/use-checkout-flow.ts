'use client'

import { useCallback, useEffect, useRef } from 'react'

import {
  formatCartSectionSummary,
  formatConfirmationSectionSummary,
  formatDeliverySectionSummary,
  formatPaymentSectionSummary,
} from '@/lib/checkout/format-summary'
import {
  canOpenSection,
  getNextSectionAfter,
  isCartSectionValid,
  isConfirmationSectionValid,
  isDeliverySectionValid,
  isPaymentSectionValid,
} from '@/lib/checkout/validation'
import type { CheckoutSectionId, CheckoutSectionVisualState } from '@/lib/checkout/types'
import { useCheckoutStore } from '@/stores/checkout.store'
import { useLocationStore } from '@/stores/location.store'

import { useCheckoutFulfillmentInput } from './use-checkout-fulfillment'

type UseCheckoutFlowOptions = {
  itemCount: number
  storeIds: string[]
  subtotal: number
  sellerName?: string | null
  sellerHasAddress: boolean
}

export function useCheckoutFlow({
  itemCount,
  storeIds,
  subtotal,
  sellerName,
  sellerHasAddress,
}: UseCheckoutFlowOptions) {
  const locationMode = useLocationStore((s) => s.mode)
  const fulfillmentInput = useCheckoutFulfillmentInput(sellerHasAddress)

  const activeSection = useCheckoutStore((s) => s.activeSection)
  const sectionState = useCheckoutStore((s) => s.sectionState)
  const sectionErrors = useCheckoutStore((s) => s.sectionErrors)
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod)
  const note = useCheckoutStore((s) => s.note)
  const initialized = useCheckoutStore((s) => s.initialized)
  const pickupSubOption = useCheckoutStore((s) => s.pickupSubOption)
  const selectedPickupHubId = useCheckoutStore((s) => s.selectedPickupHubId)

  const setActiveSection = useCheckoutStore((s) => s.setActiveSection)
  const setSectionState = useCheckoutStore((s) => s.setSectionState)
  const setSectionErrors = useCheckoutStore((s) => s.setSectionErrors)
  const setPickupSubOption = useCheckoutStore((s) => s.setPickupSubOption)
  const setSelectedPickupHubId = useCheckoutStore((s) => s.setSelectedPickupHubId)
  const setInitialized = useCheckoutStore((s) => s.setInitialized)

  const cartValid = isCartSectionValid({ itemCount, storeIds }).length === 0
  const deliveryValid = isDeliverySectionValid(fulfillmentInput).length === 0
  const paymentValid = isPaymentSectionValid({ paymentMethod }).length === 0
  const confirmationValid =
    isConfirmationSectionValid({
      cartValid,
      deliveryValid,
      paymentValid,
    }).length === 0

  const summaries = {
    cart: formatCartSectionSummary(itemCount, subtotal),
    delivery: formatDeliverySectionSummary(fulfillmentInput, sellerName),
    payment: formatPaymentSectionSummary({ paymentMethod }),
    confirmation: formatConfirmationSectionSummary(note.trim().length > 0),
  }

  const getSectionErrors = useCallback(
    (section: CheckoutSectionId): string[] => {
      if (section === 'cart') return isCartSectionValid({ itemCount, storeIds })
      if (section === 'delivery') return isDeliverySectionValid(fulfillmentInput)
      if (section === 'payment') return isPaymentSectionValid({ paymentMethod })
      return isConfirmationSectionValid({ cartValid, deliveryValid, paymentValid })
    },
    [itemCount, storeIds, fulfillmentInput, paymentMethod, cartValid, deliveryValid, paymentValid],
  )

  const revalidateSection = useCallback(
    (section: CheckoutSectionId, autoAdvance = false) => {
      const errors = getSectionErrors(section)
      setSectionErrors(section, errors)
      const isValid = errors.length === 0

      if (isValid) {
        setSectionState(section, 'valid')
        if (autoAdvance) {
          const next = getNextSectionAfter(section)
          if (next) {
            setActiveSection(next)
            setSectionState(next, 'editing')
          }
        }
      } else {
        setSectionState(section, 'invalid')
      }

      return isValid
    },
    [getSectionErrors, setSectionErrors, setSectionState, setActiveSection],
  )

  const openSection = useCallback(
    (section: CheckoutSectionId) => {
      if (!canOpenSection(section, sectionState, sectionErrors)) return

      const sections: CheckoutSectionId[] = ['cart', 'delivery', 'payment', 'confirmation']
      for (const id of sections) {
        if (id === section) {
          setSectionState(id, 'editing')
          setActiveSection(id)
        } else {
          const errors = getSectionErrors(id)
          setSectionState(id, errors.length === 0 ? 'valid' : 'invalid')
        }
      }
    },
    [sectionState, sectionErrors, getSectionErrors, setSectionState, setActiveSection],
  )

  const completeCartIfValid = useCallback(() => {
    return revalidateSection('cart', true)
  }, [revalidateSection])

  const completeDeliveryIfValid = useCallback(() => {
    return revalidateSection('delivery', true)
  }, [revalidateSection])

  const completePaymentIfValid = useCallback(() => {
    return revalidateSection('payment', true)
  }, [revalidateSection])

  const initRef = useRef(false)
  useEffect(() => {
    if (initialized || initRef.current) return
    initRef.current = true

    const cartErrors = isCartSectionValid({ itemCount, storeIds })
    if (cartErrors.length > 0) {
      setSectionState('cart', 'invalid')
      setSectionErrors('cart', cartErrors)
      setActiveSection('cart')
    } else {
      setSectionState('cart', 'valid')
      setSectionErrors('cart', [])

      if (locationMode === 'pickup') {
        setPickupSubOption(null)
        setSelectedPickupHubId(null)
        setSectionState('delivery', 'editing')
        setActiveSection('delivery')
      } else if (locationMode === 'delivery') {
        const deliveryErrors = isDeliverySectionValid(fulfillmentInput)
        if (deliveryErrors.length === 0) {
          setSectionState('delivery', 'valid')
          setSectionState('payment', 'editing')
          setActiveSection('payment')
        } else {
          setSectionState('delivery', 'editing')
          setActiveSection('delivery')
        }
      } else {
        setSectionState('delivery', 'invalid')
        setSectionErrors('delivery', ['Elegí envío o retiro para continuar.'])
        setActiveSection('delivery')
      }
    }

    setInitialized(true)
  }, [
    initialized,
    itemCount,
    storeIds,
    locationMode,
    fulfillmentInput,
    setPickupSubOption,
    setSelectedPickupHubId,
    setSectionState,
    setActiveSection,
    setSectionErrors,
    setInitialized,
  ])

  useEffect(() => {
    if (!initialized) return
    if (sectionState.cart === 'editing') {
      revalidateSection('cart', false)
    }
  }, [initialized, sectionState.cart, itemCount, storeIds, revalidateSection])

  useEffect(() => {
    if (!initialized) return
    if (sectionState.delivery === 'editing') {
      revalidateSection('delivery', false)
    }
  }, [
    initialized,
    sectionState.delivery,
    locationMode,
    pickupSubOption,
    selectedPickupHubId,
    fulfillmentInput,
    revalidateSection,
  ])

  useEffect(() => {
    if (!initialized) return
    revalidateSection('confirmation', false)
  }, [initialized, cartValid, deliveryValid, paymentValid, note, revalidateSection])

  return {
    activeSection,
    sectionState,
    sectionErrors,
    summaries,
    cartValid,
    deliveryValid,
    paymentValid,
    confirmationValid,
    openSection,
    completeCartIfValid,
    completeDeliveryIfValid,
    completePaymentIfValid,
    revalidateSection,
    canOpenSection: (section: CheckoutSectionId) =>
      canOpenSection(section, sectionState, sectionErrors),
  }
}
