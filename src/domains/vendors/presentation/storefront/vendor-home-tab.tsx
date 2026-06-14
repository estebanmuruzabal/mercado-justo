'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import type { MarketplaceListing } from '@/domains/marketplace/listings/domain/marketplace'
import type { VendorCategory, VendorReview } from '@/domains/vendors/domain/vendor'

import { VendorProductCard } from './vendor-product-card'
import { RatingStars } from './rating-stars'
import type { VendorTabId } from './vendor-tabs-config'

export function VendorHomeTab({
  bio,
  listings,
  categories,
  reviews,
  onNavigate,
}: {
  bio: string | null
  listings: MarketplaceListing[]
  categories: VendorCategory[]
  reviews: VendorReview[]
  onNavigate: (tab: VendorTabId) => void
}) {
  const featured = listings.slice(0, 4)
  const recent = listings.slice(4, 8)

  return (
    <div className='space-y-10'>
      {bio ? (
        <section className='rounded-2xl border border-neutral-200 bg-white p-6'>
          <h2 className='mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400'>Sobre la tienda</h2>
          <p className='text-sm leading-relaxed text-neutral-700'>{bio}</p>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section>
          <h2 className='mb-3 text-lg font-bold text-neutral-900'>Categorías</h2>
          <div className='flex flex-wrap gap-2'>
            {categories.map((category) => (
              <button
                key={category.id}
                type='button'
                onClick={() => onNavigate('productos')}
                className='inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white'
              >
                {category.name}
                <span className='text-xs opacity-60'>{category.count}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='flex items-center gap-2 text-lg font-bold text-neutral-900'>
              <Sparkles className='h-5 w-5 text-amber-500' />
              Destacados
            </h2>
            <button
              type='button'
              onClick={() => onNavigate('productos')}
              className='inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900'
            >
              Ver todos <ArrowRight className='h-4 w-4' />
            </button>
          </div>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4'>
            {featured.map((listing, i) => (
              <VendorProductCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        </section>
      ) : (
        <section className='rounded-2xl border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500'>
          Esta tienda todavía no publicó productos.
        </section>
      )}

      {recent.length > 0 ? (
        <section>
          <h2 className='mb-3 text-lg font-bold text-neutral-900'>Recién agregados</h2>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4'>
            {recent.map((listing, i) => (
              <VendorProductCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      {reviews.length > 0 ? (
        <section>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-lg font-bold text-neutral-900'>Últimas reseñas</h2>
            <button
              type='button'
              onClick={() => onNavigate('reviews')}
              className='inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900'
            >
              Ver todas <ArrowRight className='h-4 w-4' />
            </button>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            {reviews.slice(0, 4).map((review) => (
              <div key={review.id} className='flex gap-3 rounded-xl border border-neutral-200 bg-white p-4'>
                <Avatar className='size-9'>
                  {review.authorAvatarUrl ? (
                    <AvatarImage src={review.authorAvatarUrl} alt={review.authorName ?? ''} />
                  ) : null}
                  <AvatarFallback className='text-xs font-semibold'>
                    {(review.authorName ?? 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center justify-between gap-2'>
                    <p className='truncate text-sm font-semibold text-neutral-900'>
                      {review.authorName ?? 'Usuario'}
                    </p>
                    <span className='shrink-0 text-xs text-neutral-400'>
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <RatingStars value={review.rating} className='mt-0.5' />
                  {review.comment ? (
                    <p className='mt-1 line-clamp-2 text-sm text-neutral-600'>{review.comment}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
