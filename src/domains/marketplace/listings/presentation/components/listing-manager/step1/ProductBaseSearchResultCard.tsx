import Image from 'next/image'

import type { ProductBaseSearchResultDto } from '@/domains/marketplace/product-base/application/dto/product-base-search.dto'
import { isConfiguredRemoteImage, listingImageSrc } from '@/domains/marketplace/listings/domain/listing-image'
import { cn } from '@/shared/utils/utils'

export function ProductBaseSearchResultCard({
  result,
  selected,
  onSelect,
}: {
  result: ProductBaseSearchResultDto
  selected: boolean
  onSelect: () => void
}) {
  const imageSrc = result.image ? listingImageSrc(result.image) : null
  const unoptimized = imageSrc ? !isConfiguredRemoteImage(imageSrc) : false

  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/40',
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-background',
      )}
    >
      <div className='relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted'>
        {imageSrc ? (
          <Image src={imageSrc} alt='' fill className='object-cover' sizes='56px' unoptimized={unoptimized} />
        ) : (
          <div className='flex size-full items-center justify-center text-lg text-muted-foreground'>?</div>
        )}
      </div>

      <div className='min-w-0 flex-1 space-y-0.5'>
        <p className='truncate text-sm font-semibold text-foreground'>{result.name}</p>
        <p className='text-xs leading-relaxed text-muted-foreground'>
          {result.taxonomyPath.join(' → ')}
        </p>
        {typeof result.confidence === 'number' ? (
          <p className='text-xs text-muted-foreground'>Coincidencia {Math.round(result.confidence * 100)}%</p>
        ) : null}
      </div>
    </button>
  )
}
