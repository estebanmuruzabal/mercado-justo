'use client'

import type { CheckoutVendorFulfillmentDto } from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import type { CheckoutVendorFulfillmentSelectionDto } from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import { CheckoutVendorFulfillmentPanel } from '@/domains/logistics/presentation/components/CheckoutVendorFulfillmentPanel'
import { isDeliveryMethodCode } from '@/domains/logistics/domain/policies/checkout-fulfillment-policy'
import { Button } from '@/shared/ui/button'

import { DeliveryHomeCard } from '../delivery/delivery-home-card'

export function DeliverySection({
  vendors,
  selections,
  deliveryAddress,
  onSelectionChange,
  onContinue,
}: {
  vendors: CheckoutVendorFulfillmentDto[]
  selections: Record<string, CheckoutVendorFulfillmentSelectionDto | undefined>
  deliveryAddress: string | null
  onSelectionChange: (vendorId: string, selection: CheckoutVendorFulfillmentSelectionDto) => void
  onContinue: () => void
}) {
  const needsDeliveryAddress = Object.values(selections).some(
    (selection) => selection && isDeliveryMethodCode(selection.methodCode),
  )

  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        Tu pedido incluye productos de {vendors.length} vendedor{vendors.length === 1 ? '' : 'es'}.
        Configurá fulfillment para cada uno.
      </p>

      {needsDeliveryAddress ? (
        <div className='space-y-2'>
          <p className='text-sm font-medium'>Domicilio de entrega</p>
          <DeliveryHomeCard />
        </div>
      ) : null}

      <div className='space-y-4'>
        {vendors.map((vendor) => (
          <CheckoutVendorFulfillmentPanel
            key={vendor.vendorId}
            vendor={vendor}
            selection={selections[vendor.vendorId]}
            deliveryAddress={deliveryAddress}
            onChange={(selection) => onSelectionChange(vendor.vendorId, selection)}
          />
        ))}
      </div>

      <Button type='button' className='w-full rounded-full' onClick={onContinue}>
        Continuar con fulfillment
      </Button>
    </div>
  )
}
