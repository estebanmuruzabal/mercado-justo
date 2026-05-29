'use client'

import { useRequireReceiveMode } from '@/hooks/location/use-require-receive-mode'
import { LISTING_TYPE_LABELS, LISTING_TYPES, type ListingType } from '@/lib/listing'
import { useMarketplaceFiltersStore } from '@/stores/useMarketplaceFiltersStore'

const DB_TYPES: ListingType[] = LISTING_TYPES.filter((t) => t !== 'experience')

export function ListingTypeFilter({ compact = false }: { compact?: boolean }) {
  const selected = useMarketplaceFiltersStore((s) => s.listingType)
  const toggleListingType = useMarketplaceFiltersStore((s) => s.toggleListingType)
  const { guardReceiveMode } = useRequireReceiveMode()

  return (
    <div className={compact ? 'min-w-0' : 'w-full'}>
      {!compact ? <div className='text-xs font-semibold text-neutral-700'>Tipo</div> : null}
      <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-2'}`}>
        {DB_TYPES.map((type) => {
          const active = selected.includes(type)
          return (
            <button
              key={type}
              type='button'
              onClick={() => guardReceiveMode(() => toggleListingType(type))}
              className={
                active
                  ? 'rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50'
              }
            >
              {LISTING_TYPE_LABELS[type]}
            </button>
          )
        })}
        <button
          type='button'
          disabled
          title='Próximamente'
          className='rounded-full border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-400'
        >
          Experiencias
        </button>
      </div>
    </div>
  )
}
