'use client'

import { useLocationStore } from '@/shared/maps/location/presentation/stores/location.store'
import type { CheckoutSellerInfo } from '@/domains/marketplace/checkout/presentation/hooks/use-checkout-seller'

import { DeliveryHomeCard } from '../delivery/delivery-home-card'
import { DeliveryMissingModeBanner } from '../delivery/delivery-missing-mode-banner'
import { DeliveryPickupOptions } from '../delivery/delivery-pickup-options'
import { Button } from '@/shared/ui/button'

export function DeliverySection({
  seller,
  sellerLoading,
  onContinue,
  onFulfillmentChange,
}: {
  seller: CheckoutSellerInfo | null
  sellerLoading: boolean
  onContinue: () => void
  onFulfillmentChange: () => void
}) {
  const mode = useLocationStore((s) => s.mode)

  if (mode === null) {
    return <DeliveryMissingModeBanner />
  }

  if (mode === 'delivery') {
    return (
      <div className='space-y-4'>
        <DeliveryHomeCard />
        <Button type='button' className='w-full rounded-full' onClick={onContinue}>
          Continuar con este domicilio
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <DeliveryPickupOptions
        seller={seller}
        sellerLoading={sellerLoading}
        onFulfillmentChange={onFulfillmentChange}
      />
      <Button type='button' className='w-full rounded-full' onClick={onContinue}>
        Continuar con este retiro
      </Button>
    </div>
  )
}
