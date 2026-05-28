'use client'

import { MapPin, Store } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatDistanceFromUser } from '@/lib/checkout/distance-label'
import type { CheckoutSellerInfo } from '@/hooks/checkout/use-checkout-seller'
import { useUserLocationStore } from '@/stores/useUserLocationStore'

const SELLER_SCHEDULE_MOCK = 'Consultá horarios con el vendedor'

export function PickupSellerCard({
  seller,
  selected,
  onSelect,
  loading,
}: {
  seller: CheckoutSellerInfo | null
  selected: boolean
  onSelect: () => void
  loading?: boolean
}) {
  const userLat = useUserLocationStore((s) => s.latitude)
  const userLng = useUserLocationStore((s) => s.longitude)
  const distanceLabel = seller
    ? formatDistanceFromUser(userLat, userLng, seller.latitude, seller.longitude)
    : null

  return (
    <label
      className={cn(
        'block cursor-pointer rounded-2xl border-2 bg-white p-4 transition-colors',
        selected ? 'border-[#FF385C] ring-2 ring-[#FF385C]/15' : 'border-neutral-200 hover:border-neutral-300',
        loading && 'opacity-60',
      )}
    >
      <div className='flex items-start gap-3'>
        <input
          type='radio'
          name='pickup-seller'
          checked={selected}
          onChange={onSelect}
          disabled={loading || !seller?.address}
          className='mt-1 h-4 w-4 accent-[#FF385C]'
        />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <Store className='h-4 w-4 text-[#FF385C]' />
            <span className='text-sm font-semibold text-neutral-900'>
              Retiro en dirección del vendedor
            </span>
          </div>
          {loading ? (
            <p className='mt-2 text-sm text-neutral-500'>Cargando datos del vendedor...</p>
          ) : seller ? (
            <>
              <p className='mt-1 text-sm font-medium text-neutral-800'>{seller.name}</p>
              {distanceLabel ? (
                <p className='mt-1 text-xs text-neutral-500'>A {distanceLabel}</p>
              ) : null}
              <p className='mt-1 text-xs text-neutral-600'>{SELLER_SCHEDULE_MOCK}</p>
              {seller.address ? (
                <p className='mt-1 flex items-start gap-1 text-sm text-neutral-700'>
                  <MapPin className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                  {seller.address}
                </p>
              ) : (
                <p className='mt-1 text-sm text-red-600'>Sin dirección configurada</p>
              )}
            </>
          ) : (
            <p className='mt-2 text-sm text-neutral-500'>No se encontró el vendedor.</p>
          )}
        </div>
      </div>
    </label>
  )
}
