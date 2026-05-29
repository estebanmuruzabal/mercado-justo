'use client'

import { useRequireReceiveMode } from '@/hooks/location/use-require-receive-mode'
import type { ListingType } from '@/lib/listing'
import { useMarketplaceFiltersStore } from '@/stores/useMarketplaceFiltersStore'

type CategoryOption = {
  id: string
  name: string
  listingType: ListingType
}

export function CategoryFilter({
  categories,
  compact = false,
}: {
  categories: CategoryOption[]
  compact?: boolean
}) {
  const selected = useMarketplaceFiltersStore((s) => s.category)
  const toggleCategory = useMarketplaceFiltersStore((s) => s.toggleCategory)
  const listingTypes = useMarketplaceFiltersStore((s) => s.listingType)
  const { guardReceiveMode } = useRequireReceiveMode()

  const filteredCategories =
    listingTypes.length > 0
      ? categories.filter((c) => listingTypes.includes(c.listingType))
      : categories

  if (filteredCategories.length === 0) return null

  return (
    <div className={compact ? 'min-w-0' : 'w-full'}>
      {!compact ? <div className='text-xs font-semibold text-neutral-700'>Categoría</div> : null}
      <div className={`flex max-h-24 flex-wrap gap-1.5 overflow-y-auto ${compact ? '' : 'mt-2'}`}>
        {filteredCategories.map((cat) => {
          const active = selected.includes(cat.id)
          return (
            <button
              key={cat.id}
              type='button'
              onClick={() => guardReceiveMode(() => toggleCategory(cat.id))}
              className={
                active
                  ? 'rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white'
                  : 'rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50'
              }
            >
              {cat.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
