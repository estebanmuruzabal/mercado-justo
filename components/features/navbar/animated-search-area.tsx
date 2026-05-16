'use client'

import { NAVBAR_TABS, type NavbarListingType } from './types'
import { ProductsSearchFields } from './search-fields/products-search-fields'
import { PropertiesSearchFields } from './search-fields/properties-search-fields'
import { ExperiencesSearchFields } from './search-fields/experiences-search-fields'
import { ServicesSearchFields } from './search-fields/services-search-fields'

export function AnimatedSearchArea({
  activeListingType,
  isCompact,
}: {
  activeListingType: NavbarListingType
  isCompact: boolean
}) {
  function renderFields(variant: 'expanded' | 'compact') {
    if (activeListingType === NAVBAR_TABS[0].id) return <ProductsSearchFields variant={variant} />
    if (activeListingType === NAVBAR_TABS[1].id) return <PropertiesSearchFields variant={variant} />
    if (activeListingType === NAVBAR_TABS[2].id) return <ExperiencesSearchFields variant={variant} />
    return <ServicesSearchFields variant={variant} />
  }

  return (
    <div className='relative mx-auto w-full max-w-4xl rounded-full border bg-white/95 p-4 shadow-lg'>
      <div className='space-y-3'>
        <div
          className={
            'transition-all duration-300 overflow-hidden ' +
            (isCompact
              ? 'max-h-0 opacity-0 translate-y-1 pointer-events-none'
              : 'max-h-[260px] opacity-100 translate-y-0')
          }
        >
          {renderFields('expanded')}
        </div>

        <div
          className={
            'transition-all duration-300 overflow-hidden ' +
            (isCompact
              ? 'max-h-[160px] opacity-100 translate-y-0 pointer-events-auto'
              : 'max-h-0 opacity-0 translate-y-1 pointer-events-none')
          }
        >
          {renderFields('compact')}
        </div>
      </div>
    </div>
  )
}

