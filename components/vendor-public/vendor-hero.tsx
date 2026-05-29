import Image from 'next/image'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { isConfiguredRemoteImage } from '@/lib/listing-image'
import { cn } from '@/lib/utils'
import type { VendorProfile } from '@/types/vendor'

import { RatingStars } from './rating-stars'
import { VendorActions } from './vendor-actions'

export function VendorHero({
  profile,
  isAuthenticated,
  isOwner,
  isFollowing,
}: {
  profile: VendorProfile
  isAuthenticated: boolean
  isOwner: boolean
  isFollowing: boolean
}) {
  const joined = format(new Date(profile.createdAt), "MMMM yyyy", { locale: es })
  const bannerUnoptimized = profile.bannerUrl ? !isConfiguredRemoteImage(profile.bannerUrl) : false
  const logoUnoptimized = profile.logoUrl ? !isConfiguredRemoteImage(profile.logoUrl) : false

  return (
    <header className='relative'>
      {/* Banner */}
      <div className='relative h-44 w-full overflow-hidden sm:h-60 md:h-72'>
        {profile.bannerUrl ? (
          <Image
            src={profile.bannerUrl}
            alt={`Banner de ${profile.name}`}
            fill
            priority
            sizes='100vw'
            unoptimized={bannerUnoptimized}
            className='object-cover'
          />
        ) : (
          <div className='h-full w-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-black' />
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent' />
      </div>

      {/* Identity */}
      <div className='mx-auto max-w-5xl px-4'>
        <div className='-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between'>
          <div className='flex items-end gap-4'>
            <div
              className={cn(
                'relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-neutral-100 shadow-lg sm:h-28 sm:w-28',
              )}
            >
              {profile.logoUrl ? (
                <Image
                  src={profile.logoUrl}
                  alt={profile.name}
                  fill
                  sizes='112px'
                  unoptimized={logoUnoptimized}
                  className='object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center bg-neutral-900 text-2xl font-bold text-white'>
                  {profile.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className='pb-1'>
              <h1 className='text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl'>{profile.name}</h1>
              <p className='text-sm text-neutral-500'>@{profile.slug}</p>
            </div>
          </div>

          <div className='pb-1 sm:self-end'>
            <VendorActions
              storeId={profile.id}
              slug={profile.slug}
              allowFollowers={profile.allowFollowers}
              initialFollowing={isFollowing}
              isAuthenticated={isAuthenticated}
              isOwner={isOwner}
            />
          </div>
        </div>

        {profile.bio ? (
          <p className='mt-4 max-w-2xl text-sm leading-relaxed text-neutral-700'>{profile.bio}</p>
        ) : null}

        {/* Meta row */}
        <div className='mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-600'>
          <span className='inline-flex items-center gap-1.5'>
            <RatingStars value={profile.ratingAvg} />
            <span className='font-medium text-neutral-900'>{profile.ratingAvg.toFixed(1)}</span>
            <span className='text-neutral-400'>({profile.reviewCount})</span>
          </span>
          <span className='inline-flex items-center gap-1.5'>
            <Users className='h-4 w-4 text-neutral-400' />
            <span className='font-medium text-neutral-900'>{profile.followerCount}</span> seguidores
          </span>
          {profile.address ? (
            <span className='inline-flex items-center gap-1.5'>
              <MapPin className='h-4 w-4 text-neutral-400' />
              {profile.address}
            </span>
          ) : null}
          <span className='inline-flex items-center gap-1.5'>
            <CalendarDays className='h-4 w-4 text-neutral-400' />
            Desde {joined}
          </span>
        </div>
      </div>
    </header>
  )
}
