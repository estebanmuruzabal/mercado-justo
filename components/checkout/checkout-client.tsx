'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { useCartStore } from '@/stores/cart-store/cart-store'
import { useCheckoutStore } from '@/stores/checkout.store'
import { createOrderFromCartAction } from '@/server/actions/checkout.actions'
import { createClient } from '@/lib/supabase/client'
import { useCheckoutFlow } from '@/hooks/checkout/use-checkout-flow'
import { useCheckoutSeller } from '@/hooks/checkout/use-checkout-seller'
import type { CheckoutSectionId, PaymentMethodId } from '@/lib/checkout/types'

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

  useEffect(() => {
    useCheckoutStore.getState().resetCheckoutUi()
  }, [])

  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod)

  const storeIds = useMemo(() => [...new Set(items.map((i) => i.storeId))], [items])
  const primaryStoreId = storeIds.length === 1 ? storeIds[0]! : storeIds[0] ?? null

  const { seller, loading: sellerLoading, sellerHasAddress } = useCheckoutSeller(primaryStoreId)

  const flow = useCheckoutFlow({
    itemCount,
    storeIds,
    subtotal: totalPrice,
    sellerName: seller?.name ?? null,
    sellerHasAddress,
  })

  const [storeNames, setStoreNames] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const ids = [...new Set(items.map((i) => i.storeId))]
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
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        storeId: i.storeId,
        title: i.title,
      })),
    [items],
  )

  const subtotal = totalPrice
  const deliveryPrice = 0
  const total = subtotal + deliveryPrice

  const multiVendorError =
    storeIds.length > 1 ? 'El checkout por ahora solo admite un vendedor por pedido.' : null

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
        // TODO: pass CheckoutMetadata when order schema supports fulfillment + payment + note
        const { orderId } = await createOrderFromCartAction(cartPayload)
        clearCart()
        useCheckoutStore.getState().resetCheckoutUi()
        router.push(`/purchase-success?orderId=${orderId}`)
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
          multiVendorError={multiVendorError}
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
        <DeliverySection
          seller={seller}
          sellerLoading={sellerLoading}
          onContinue={flow.completeDeliveryIfValid}
          onFulfillmentChange={() => flow.revalidateSection('delivery', false)}
        />
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
        <ConfirmationSection />
      </CheckoutAccordionSection>
    </CheckoutPageLayout>
  )
}
