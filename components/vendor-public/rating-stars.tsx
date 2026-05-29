import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

export function RatingStars({
  value,
  size = 'sm',
  className,
}: {
  value: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'
  const rounded = Math.round(value)

  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i <= rounded ? 'fill-amber-400 stroke-amber-400' : 'fill-transparent stroke-neutral-300',
          )}
        />
      ))}
    </div>
  )
}
