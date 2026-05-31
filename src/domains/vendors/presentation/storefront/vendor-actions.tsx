'use client'

import { useState } from 'react'
import { Heart, MessageSquare } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/utils/utils'

import { VendorFollowButton } from './vendor-follow-button'

export function VendorActions({
  storeId,
  slug,
  allowFollowers,
  initialFollowing,
  isAuthenticated,
  isOwner,
}: {
  storeId: string
  slug: string
  allowFollowers: boolean
  initialFollowing: boolean
  isAuthenticated: boolean
  isOwner: boolean
}) {
  const { toast } = useToast()
  const [favorite, setFavorite] = useState(false)

  if (isOwner) {
    return (
      <p className='text-sm text-neutral-500'>Esta es tu tienda. Editala desde tu panel de vendedor.</p>
    )
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {allowFollowers ? (
        <VendorFollowButton
          storeId={storeId}
          slug={slug}
          initialFollowing={initialFollowing}
          isAuthenticated={isAuthenticated}
        />
      ) : null}

      <Button
        type='button'
        variant='outline'
        className='rounded-full'
        onClick={() => {
          setFavorite((v) => !v)
          toast({ title: favorite ? 'Quitado de favoritos' : 'Agregado a favoritos' })
        }}
      >
        <Heart className={cn('mr-1.5 h-4 w-4', favorite ? 'fill-rose-500 stroke-rose-500' : '')} />
        Favorito
      </Button>

      <Button
        type='button'
        variant='outline'
        className='rounded-full'
        onClick={() => toast({ title: 'Mensajes', description: 'Esta función estará disponible pronto.' })}
      >
        <MessageSquare className='mr-1.5 h-4 w-4' />
        Mensaje
      </Button>
    </div>
  )
}
