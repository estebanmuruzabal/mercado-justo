'use client'

import Image from 'next/image'

import { isConfiguredRemoteImage, listingImageSrc } from '@/domains/marketplace/listings/domain/listing-image'
import { cn } from '@/shared/utils/utils'

type ListingCardImageProps = {
  src: string
  alt: string
  heightClass?: string
  className?: string
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void
}

export function ListingCardImage({
  src,
  alt,
  heightClass = 'h-[260px]',
  className,
  onClick,
}: ListingCardImageProps) {
  const resolvedSrc = listingImageSrc(src)
  const unoptimized = !isConfiguredRemoteImage(resolvedSrc)

  return (
    <div className={cn('relative w-full overflow-hidden', heightClass)}>
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        sizes='280px'
        unoptimized={unoptimized}
        className={cn('object-cover transition duration-300 hover:scale-105', className)}
        onClick={onClick}
      />
    </div>
  )
}
