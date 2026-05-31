'use client'

import Image from 'next/image'

import { isConfiguredRemoteImage } from '@/domains/marketplace/listings/domain/listing-image'
import { cn } from '@/shared/utils/utils'

type ProfileAvatarImageProps = {
  src: string
  alt?: string
  className?: string
  sizes?: string
}

export function ProfileAvatarImage({
  src,
  alt = 'Perfil',
  className,
  sizes = '32px',
}: ProfileAvatarImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn('object-cover', className)}
      unoptimized={!isConfiguredRemoteImage(src)}
    />
  )
}
