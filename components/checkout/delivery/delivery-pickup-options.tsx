'use client'

import { useState } from 'react'

import { PICKUP_HUBS } from '@/lib/checkout/pickup-points.mock'
import { useCheckoutStore } from '@/stores/checkout.store'
import type { CheckoutSellerInfo } from '@/hooks/checkout/use-checkout-seller'
import type { PickupSubOption } from '@/lib/checkout/types'

import { PickupHubCard } from './pickup-hub-card'
import { PickupHubMapDialog } from './pickup-hub-map-dialog'
import { PickupSellerCard } from './pickup-seller-card'
import { cn } from '@/lib/utils'
import { getPickupHubById } from '@/lib/checkout/pickup-points.mock'

export function DeliveryPickupOptions({
  seller,
  sellerLoading,
  onFulfillmentChange,
}: {
  seller: CheckoutSellerInfo | null
  sellerLoading: boolean
  onFulfillmentChange: () => void
}) {
  const pickupSubOption = useCheckoutStore((s) => s.pickupSubOption)
  const selectedPickupHubId = useCheckoutStore((s) => s.selectedPickupHubId)
  const setPickupSubOption = useCheckoutStore((s) => s.setPickupSubOption)
  const setSelectedPickupHubId = useCheckoutStore((s) => s.setSelectedPickupHubId)

  const [mapHubId, setMapHubId] = useState<string | null>(null)
  const mapHub = mapHubId ? getPickupHubById(mapHubId) : null

  const selectSubOption = (option: PickupSubOption) => {
    setPickupSubOption(option)
    onFulfillmentChange()
  }

  const selectHub = (hubId: string) => {
    setPickupSubOption('hub')
    setSelectedPickupHubId(hubId)
    onFulfillmentChange()
  }

  return (
    <div className='space-y-4'>
      <p className='text-sm text-neutral-600'>Elegí dónde vas a retirar tu pedido.</p>

      <div className='space-y-2'>
        <button
          type='button'
          onClick={() => selectSubOption('hub')}
          className={cn(
            'w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors',
            pickupSubOption === 'hub'
              ? 'border-[#FF385C] bg-[#FF385C]/5 text-neutral-900'
              : 'border-neutral-200 bg-white text-neutral-700',
          )}
        >
          Retiro en punto de entrega
        </button>

        {pickupSubOption === 'hub' ? (
          <div className='space-y-3 pl-1'>
            {PICKUP_HUBS.map((hub) => (
              <PickupHubCard
                key={hub.id}
                hub={hub}
                selected={selectedPickupHubId === hub.id}
                onSelect={() => selectHub(hub.id)}
                onViewMap={() => setMapHubId(hub.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className='space-y-2'>
        <button
          type='button'
          onClick={() => selectSubOption('seller')}
          className={cn(
            'w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors',
            pickupSubOption === 'seller'
              ? 'border-[#FF385C] bg-[#FF385C]/5 text-neutral-900'
              : 'border-neutral-200 bg-white text-neutral-700',
          )}
        >
          Retiro en dirección del vendedor
        </button>

        {pickupSubOption === 'seller' ? (
          <PickupSellerCard
            seller={seller}
            selected
            loading={sellerLoading}
            onSelect={() => {
              setPickupSubOption('seller')
              onFulfillmentChange()
            }}
          />
        ) : null}
      </div>

      <PickupHubMapDialog
        hub={mapHub ?? null}
        open={mapHubId !== null}
        onOpenChange={(next) => {
          if (!next) setMapHubId(null)
        }}
      />
    </div>
  )
}
