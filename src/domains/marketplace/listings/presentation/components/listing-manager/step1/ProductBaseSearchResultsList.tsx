import type { ProductBaseSearchResultDto } from '@/domains/marketplace/product-base/application/dto/product-base-search.dto'
import { Skeleton } from '@/shared/ui/skeleton'

import { ProductBaseSearchResultCard } from './ProductBaseSearchResultCard'

export function ProductBaseSearchResultsList({
  results,
  selectedId,
  onSelect,
  isLoading,
  isProcessing,
  error,
  emptyMessage,
  onRetry,
}: {
  results: ProductBaseSearchResultDto[]
  selectedId: string | null
  onSelect: (result: ProductBaseSearchResultDto) => void
  isLoading?: boolean
  isProcessing?: boolean
  error?: string | null
  emptyMessage?: string
  onRetry?: () => void
}) {
  if (isLoading || isProcessing) {
    return (
      <div className='space-y-2' aria-live='polite' aria-busy='true'>
        <p className='text-sm text-muted-foreground'>{isProcessing ? 'Procesando…' : 'Buscando…'}</p>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className='flex items-center gap-3 rounded-xl border p-3'>
            <Skeleton className='size-14 rounded-lg' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-1/2' />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm' role='alert'>
        <p className='text-destructive'>{error}</p>
        {onRetry ? (
          <button type='button' className='mt-2 font-medium text-destructive underline' onClick={onRetry}>
            Reintentar
          </button>
        ) : null}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
        {emptyMessage ?? 'No encontramos productos. Probá con más detalle.'}
      </p>
    )
  }

  return (
    <div className='space-y-2' aria-live='polite'>
      {results.map((result) => (
        <ProductBaseSearchResultCard
          key={result.id}
          result={result}
          selected={selectedId === result.id}
          onSelect={() => onSelect(result)}
        />
      ))}
    </div>
  )
}
