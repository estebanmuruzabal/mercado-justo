'use client'

import { Ticket } from 'lucide-react'

import type { CheckoutVendorFulfillmentDto } from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import { FulfillmentAvailabilityPreview } from '@/domains/logistics/presentation/components/FulfillmentAvailabilityPreview'
import { useCheckoutStore } from '@/domains/marketplace/checkout/presentation/stores/checkout.store'

import { OrderNoteField } from '../confirmation/order-note-field'

export function ConfirmationSection({
  vendors = [],
}: {
  vendors?: CheckoutVendorFulfillmentDto[]
}) {
  const vendorFulfillment = useCheckoutStore((s) => s.vendorFulfillment)

  return (
    <div className='space-y-4'>
      <p className='text-sm text-neutral-600'>
        Revisá el resumen abajo y confirmá tu compra cuando estés listo.
      </p>

      <OrderNoteField />

      <div className='space-y-4'>
        {vendors.map((vendor) => {
          const selection = vendorFulfillment[vendor.vendorId]
          if (!selection) return null

          const method = vendor.methods.find((item) => item.code === selection.methodCode)
          const pickupWindows =
            selection.methodCode.startsWith('pickup_')
              ? vendor.pickupWindows.filter((window) => window.id === selection.windowId)
              : []
          const deliveryWindows =
            selection.methodCode.startsWith('delivery_')
              ? vendor.deliveryWindows.filter((window) => window.id === selection.windowId)
              : []

          return (
            <FulfillmentAvailabilityPreview
              key={vendor.vendorId}
              mode='checkout'
              preview={{
                ...vendor.preview,
                methods: method ? [{ ...method, isDefault: false }] : [],
                pickupWindows,
                deliveryWindows,
                preferences: {
                  ...vendor.preview.preferences,
                  deliveryAddress: selection.deliveryAddress,
                },
                isReadyForCheckout: true,
                readinessIssues: [],
              }}
            />
          )
        })}
      </div>

      <div className='flex flex-col gap-2 opacity-60'>
        <div className='flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-3 py-2.5 text-sm text-neutral-500'>
          <Ticket className='h-4 w-4 shrink-0' />
          Cupones — Próximamente
        </div>
      </div>
    </div>
  )
}
