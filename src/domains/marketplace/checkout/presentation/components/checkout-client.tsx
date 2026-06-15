'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { useCartStore } from '@/domains/marketplace/checkout/presentation/stores/cart-store/cart-store'
import { useCheckoutStore } from '@/domains/marketplace/checkout/presentation/stores/checkout.store'
import { createOrderFromCartAction } from '@/domains/marketplace/orders/application/actions/checkout.actions'
import { getCheckoutFulfillmentOptionsAction } from '@/domains/logistics/application/actions/checkout-fulfillment.actions'
import { buildDefaultCheckoutSelection } from '@/domains/logistics/domain/policies/checkout-fulfillment-policy'
import type { CheckoutVendorFulfillmentDto } from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import { useCheckoutFlow } from '@/domains/marketplace/checkout/presentation/hooks/use-checkout-flow'
import type { CheckoutSectionId, PaymentMethodId } from '@/domains/marketplace/checkout/domain/checkout/types'
import { useLocationStore } from '@/shared/maps/location/presentation/stores/location.store'
import { createClient } from '@/shared/database/supabase/client'

import { CheckoutPageLayout } from './checkout-page-layout'
import { CheckoutAccordionSection } from './checkout-accordion'
import { CheckoutSummaryBar } from './checkout-summary-bar'
import { CartSection } from './sections/cart-section'
import { DeliverySection } from './sections/delivery-section'
import { PaymentSection } from './sections/payment-section'
import { ConfirmationSection } from './sections/confirmation-section'

export function CheckoutClient() {
  const router = useRouter()
  const { items, itemCount, totalPrice, setQuantity, removeItem, clearCart } = useCartStore()
  const locationAddress = useLocationStore((s) => s.address)

  useEffect(() => {
    useCheckoutStore.getState().resetCheckoutUi()
  }, [])

  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod)
  const vendorFulfillment = useCheckoutStore((s) => s.vendorFulfillment)
  const setVendorFulfillmentSelection = useCheckoutStore((s) => s.setVendorFulfillmentSelection)

  const storeIds = useMemo(() => [...new Set(items.map((i) => i.storeId).filter(Boolean))], [items])
  const itemCountsByVendor = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of items) {
      if (!item.storeId) continue
      counts[item.storeId] = (counts[item.storeId] ?? 0) + item.quantity
    }
    return counts
  }, [items])

  const [vendors, setVendors] = useState<CheckoutVendorFulfillmentDto[]>([])
  const [vendorsLoading, setVendorsLoading] = useState(false)

  useEffect(() => {
    if (storeIds.length === 0) {
      setVendors([])
      return
    }

    let cancelled = false
    setVendorsLoading(true)

    void (async () => {
      const options = await getCheckoutFulfillmentOptionsAction({
        vendorIds: storeIds,
        itemCountsByVendor,
      })
      if (cancelled) return
      setVendors(options)
      setVendorsLoading(false)

      for (const vendor of options) {
        const existing = useCheckoutStore.getState().vendorFulfillment[vendor.vendorId]
        if (!existing) {
          const defaults = buildDefaultCheckoutSelection(vendor)
          if (defaults) {
            setVendorFulfillmentSelection(vendor.vendorId, defaults)
          }
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [storeIds, itemCountsByVendor, setVendorFulfillmentSelection])

  useEffect(() => {
    for (const vendorId of storeIds) {
      const selection = useCheckoutStore.getState().vendorFulfillment[vendorId]
      if (!selection || !selection.methodCode.startsWith('delivery_')) continue
      if (selection.deliveryAddress === locationAddress) continue
      setVendorFulfillmentSelection(vendorId, {
        ...selection,
        deliveryAddress: locationAddress,
      })
    }
  }, [locationAddress, storeIds, setVendorFulfillmentSelection])

  const flow = useCheckoutFlow({
    itemCount,
    storeIds,
    subtotal: totalPrice,
    vendors,
  })

  const [storeNames, setStoreNames] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const ids = [...new Set(items.map((i) => i.storeId).filter(Boolean))]
    if (ids.length === 0) {
      setStoreNames({})
      return
    }

    let cancelled = false
    void (async () => {
      const supabase = createClient()
      const { data } = await supabase.from('store').select('id, name').in('id', ids)
      if (cancelled) return
      const next: Record<string, string> = {}
      const rows = (data ?? []) as Array<{ id: string; name: string | null }>
      for (const row of rows) {
        next[String(row.id)] = typeof row.name === 'string' && row.name ? row.name : 'Vendedor'
      }
      setStoreNames(next)
    })()

    return () => {
      cancelled = true
    }
  }, [items])

  const cartPayload = useMemo(
    () =>
      items.map((i) => ({
        variantId: i.variantId,
        variantName: i.variantName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        storeId: i.storeId,
        title: i.title,
      })),
    [items],
  )

  const fulfillmentPayload = useMemo(
    () =>
      storeIds
        .map((vendorId) => vendorFulfillment[vendorId])
        .filter((selection): selection is NonNullable<typeof selection> => selection != null)
        .map((selection) => ({
          ...selection,
          deliveryAddress: locationAddress,
        })),
    [storeIds, vendorFulfillment, locationAddress],
  )

  const subtotal = totalPrice
  const deliveryPrice = 0
  const total = subtotal + deliveryPrice

  const handleSectionToggle = (section: CheckoutSectionId) => {
    if (flow.sectionState[section] === 'editing') {
      flow.revalidateSection(section, false)
      return
    }
    flow.openSection(section)
  }

  const handlePaymentSelect = (method: PaymentMethodId) => {
    setPaymentMethod(method)
    queueMicrotask(() => {
      flow.completePaymentIfValid()
    })
  }

  const handleConfirm = () => {
    setFormError(null)
    if (!flow.confirmationValid) {
      flow.revalidateSection('confirmation', false)
      flow.openSection('confirmation')
      return
    }

    startTransition(async () => {
      try {
        const { orderId, orderIds } = await createOrderFromCartAction({
          items: cartPayload,
          fulfillments: fulfillmentPayload,
        })
        clearCart()
        useCheckoutStore.getState().resetCheckoutUi()
        const params = new URLSearchParams({ orderId })
        if (orderIds.length > 0) {
          params.set('orderIds', orderIds.join(','))
        }
        router.push(`/purchase-success?${params.toString()}`)
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'No se pudo crear la orden.')
      }
    })
  }

  const summaryBar = (
    <CheckoutSummaryBar
      subtotal={subtotal}
      deliveryPrice={deliveryPrice}
      total={total}
      itemCount={itemCount}
      canConfirm={flow.confirmationValid}
      isPending={isPending}
      formError={formError}
      onConfirm={handleConfirm}
      variant='sticky'
    />
  )

  const summaryBarSidebar = (
    <CheckoutSummaryBar
      subtotal={subtotal}
      deliveryPrice={deliveryPrice}
      total={total}
      itemCount={itemCount}
      canConfirm={flow.confirmationValid}
      isPending={isPending}
      formError={formError}
      onConfirm={handleConfirm}
      variant='sidebar'
    />
  )

  return (
    <CheckoutPageLayout
      title='Checkout'
      subtitle={
        itemCount > 0
          ? `${itemCount} artículo${itemCount === 1 ? '' : 's'} en tu pedido`
          : 'Tu carrito está vacío'
      }
      summaryBar={summaryBar}
      summaryBarDesktop={summaryBarSidebar}
    >
      <CheckoutAccordionSection
        sectionId='cart'
        state={flow.sectionState.cart}
        summary={flow.summaries.cart}
        errors={flow.sectionErrors.cart}
        onToggle={() => handleSectionToggle('cart')}
      >
        <CartSection
          items={items}
          storeNames={storeNames}
          multiVendorError={null}
          setQuantity={setQuantity}
          removeItem={removeItem}
          onContinue={flow.completeCartIfValid}
        />
      </CheckoutAccordionSection>

      <CheckoutAccordionSection
        sectionId='delivery'
        state={flow.sectionState.delivery}
        summary={flow.summaries.delivery}
        errors={flow.sectionErrors.delivery}
        disabled={!flow.canOpenSection('delivery')}
        onToggle={() => handleSectionToggle('delivery')}
      >
        {vendorsLoading ? (
          <p className='text-sm text-muted-foreground'>Cargando opciones de fulfillment…</p>
        ) : (
          <DeliverySection
            vendors={vendors}
            selections={vendorFulfillment}
            deliveryAddress={locationAddress}
            onSelectionChange={setVendorFulfillmentSelection}
            onContinue={flow.completeDeliveryIfValid}
          />
        )}
      </CheckoutAccordionSection>

      <CheckoutAccordionSection
        sectionId='payment'
        state={flow.sectionState.payment}
        summary={flow.summaries.payment}
        errors={flow.sectionErrors.payment}
        disabled={!flow.canOpenSection('payment')}
        onToggle={() => handleSectionToggle('payment')}
      >
        <PaymentSection onSelect={handlePaymentSelect} />
      </CheckoutAccordionSection>

      <CheckoutAccordionSection
        sectionId='confirmation'
        state={flow.sectionState.confirmation}
        summary={flow.summaries.confirmation}
        errors={flow.sectionErrors.confirmation}
        disabled={!flow.canOpenSection('confirmation')}
        onToggle={() => handleSectionToggle('confirmation')}
      >
        <ConfirmationSection vendors={vendors} />
      </CheckoutAccordionSection>
    </CheckoutPageLayout>
  )
}
