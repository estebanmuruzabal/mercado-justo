'use client'

import { LayoutGrid, Map, SplitSquareHorizontal } from 'lucide-react'

import { useMarketplaceViewStore, type MarketplaceViewMode } from '@/domains/marketplace/listings/presentation/stores/useMarketplaceViewStore'

const MODES: { id: MarketplaceViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'list', label: 'Lista', icon: LayoutGrid },
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'hybrid', label: 'Híbrido', icon: SplitSquareHorizontal },
]

export function ViewModeToggle({ compact = false }: { compact?: boolean }) {
  const viewMode = useMarketplaceViewStore((s) => s.viewMode)
  const setViewMode = useMarketplaceViewStore((s) => s.setViewMode)

  return (
    <div className={compact ? 'min-w-0' : 'w-full'}>
      {!compact ? <div className='text-xs font-semibold text-neutral-700'>Vista</div> : null}
      <div
        role='radiogroup'
        aria-label='Modo de vista'
        className={`flex overflow-hidden rounded-full border border-neutral-200 bg-white p-0.5 ${compact ? '' : 'mt-2'}`}
      >
        {MODES.map(({ id, label, icon: Icon }) => {
          const active = viewMode === id
          return (
            <button
              key={id}
              type='button'
              role='radio'
              aria-checked={active}
              aria-label={label}
              title={label}
              onClick={() => setViewMode(id)}
              className={
                active
                  ? 'flex flex-1 items-center justify-center gap-1 rounded-full bg-neutral-900 px-2 py-1.5 text-xs font-semibold text-white sm:px-3'
                  : 'flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 sm:px-3'
              }
            >
              <Icon className='h-3.5 w-3.5' />
              {!compact ? <span className='hidden sm:inline'>{label}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
