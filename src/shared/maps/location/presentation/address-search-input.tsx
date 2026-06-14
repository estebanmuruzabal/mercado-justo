'use client'

import { Search } from 'lucide-react'
import { useMemo } from 'react'

import type { AddressSuggestion } from '@/shared/maps/location/location-types'
import { useAddressSearch } from '@/shared/maps/location/presentation/hooks/use-address-search'

export function AddressSearchInput({
  onSelectSuggestion,
}: {
  onSelectSuggestion: (s: AddressSuggestion) => void
}) {
  const { query, setQuery, suggestions, selected, setSelected, status, isQueryInResistencia, outsideMessage } =
    useAddressSearch()

  const showOutside = useMemo(() => {
    if (query.trim().length < 2) return false
    if (status === 'loading') return false
    return !isQueryInResistencia
  }, [query, status, isQueryInResistencia])

  return (
    <div className='space-y-3'>
      <div className='relative'>
        <Search className='absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500' />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Dirección o punto de referencia'
          className='h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-neutral-400'
        />
      </div>

      {showOutside ? <div className='text-sm text-neutral-400'>{outsideMessage}</div> : null}

      {suggestions.length > 0 ? (
        <div className='max-h-56 overflow-y-auto rounded-2xl border border-neutral-100 bg-white shadow-sm'>
          {suggestions.map((s) => {
            const active = selected?.address === s.address
            return (
              <button
                key={`${s.latitude},${s.longitude},${s.address}`}
                type='button'
                onClick={() => {
                  setSelected(s)
                  onSelectSuggestion(s)
                }}
                className={`block w-full cursor-pointer px-4 py-3 text-left text-sm transition-colors ${
                  active ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                }`}
              >
                <div className='font-semibold text-neutral-900 line-clamp-2'>{s.address}</div>
              </button>
            )
          })}
        </div>
      ) : null}

      {status === 'error' ? (
        <div className='text-sm text-destructive'>No pudimos cargar sugerencias. Probá nuevamente.</div>
      ) : null}
    </div>
  )
}

