'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/utils/utils'
import { SIGN_IN_PATH } from '@/shared/routing/routes'
import {
  deleteVendorReviewAction,
  upsertVendorReviewAction,
} from '@/domains/marketplace/reviews/application/actions/vendor-review.actions'
import type { VendorReview } from '@/domains/vendors/domain/vendor'

import { RatingStars } from './rating-stars'

function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className='flex items-center gap-1'>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type='button'
          disabled={disabled}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className='p-0.5 disabled:cursor-not-allowed'
          aria-label={`${i} estrellas`}
        >
          <Star
            className={cn(
              'h-6 w-6 transition',
              (hover || value) >= i ? 'fill-amber-400 stroke-amber-400' : 'fill-transparent stroke-neutral-300',
            )}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewItem({ review }: { review: VendorReview }) {
  const initials = (review.authorName ?? 'U').slice(0, 2).toUpperCase()
  return (
    <div className='flex gap-3 rounded-xl border border-neutral-200 bg-white p-4'>
      <Avatar className='size-10'>
        {review.authorAvatarUrl ? <AvatarImage src={review.authorAvatarUrl} alt={review.authorName ?? ''} /> : null}
        <AvatarFallback className='text-xs font-semibold'>{initials}</AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1 space-y-1'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <p className='text-sm font-semibold text-neutral-900'>{review.authorName ?? 'Usuario'}</p>
          <span className='text-xs text-neutral-400'>
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: es })}
          </span>
        </div>
        <RatingStars value={review.rating} />
        {review.comment ? <p className='pt-1 text-sm text-neutral-700'>{review.comment}</p> : null}
      </div>
    </div>
  )
}

export function VendorReviewsTab({
  storeId,
  slug,
  ratingAvg,
  reviewCount,
  initialReviews,
  isAuthenticated,
  isOwner,
  myReview,
}: {
  storeId: string
  slug: string
  ratingAvg: number
  reviewCount: number
  initialReviews: VendorReview[]
  isAuthenticated: boolean
  isOwner: boolean
  myReview: VendorReview | null
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(myReview?.rating ?? 0)
  const [comment, setComment] = useState(myReview?.comment ?? '')

  function submit() {
    if (rating < 1) {
      toast({ title: 'Elegí una puntuación', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const result = await upsertVendorReviewAction({ storeId, slug, rating, comment })
      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }
      toast({ title: '¡Gracias!', description: 'Tu reseña fue publicada.' })
      router.refresh()
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteVendorReviewAction({ storeId, slug })
      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }
      setRating(0)
      setComment('')
      toast({ title: 'Reseña eliminada' })
      router.refresh()
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-6 rounded-2xl border border-neutral-200 bg-white p-6'>
        <div className='text-center'>
          <p className='text-4xl font-bold text-neutral-900'>{ratingAvg.toFixed(1)}</p>
          <RatingStars value={ratingAvg} className='mt-1 justify-center' />
          <p className='mt-1 text-xs text-neutral-500'>{reviewCount} reseñas</p>
        </div>
        <div className='hidden h-16 w-px bg-neutral-200 sm:block' />
        <p className='hidden flex-1 text-sm text-neutral-600 sm:block'>
          Las reseñas ayudan a otros compradores a confiar en esta tienda.
        </p>
      </div>

      {!isOwner ? (
        isAuthenticated ? (
          <div className='space-y-3 rounded-2xl border border-neutral-200 bg-white p-5'>
            <p className='text-sm font-semibold text-neutral-900'>
              {myReview ? 'Editá tu reseña' : 'Dejá tu reseña'}
            </p>
            <StarInput value={rating} onChange={setRating} disabled={isPending} />
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder='Contanos tu experiencia (opcional)'
              disabled={isPending}
            />
            <div className='flex gap-2'>
              <Button onClick={submit} disabled={isPending} className='rounded-full'>
                {isPending ? 'Guardando...' : myReview ? 'Actualizar' : 'Publicar reseña'}
              </Button>
              {myReview ? (
                <Button
                  variant='ghost'
                  onClick={remove}
                  disabled={isPending}
                  className='rounded-full text-destructive hover:text-destructive'
                >
                  <Trash2 className='mr-1 h-4 w-4' />
                  Eliminar
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className='rounded-2xl border border-dashed border-neutral-300 p-5 text-center text-sm text-neutral-500'>
            <a href={SIGN_IN_PATH} className='font-medium text-foreground underline'>
              Iniciá sesión
            </a>{' '}
            para dejar una reseña.
          </div>
        )
      ) : null}

      <div className='space-y-3'>
        {initialReviews.length === 0 ? (
          <p className='py-8 text-center text-sm text-neutral-500'>Todavía no hay reseñas. ¡Sé el primero!</p>
        ) : (
          initialReviews.map((review) => <ReviewItem key={review.id} review={review} />)
        )}
      </div>
    </div>
  )
}
