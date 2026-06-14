'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, UserPlus } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/utils/utils'
import { followVendorAction, unfollowVendorAction } from '@/domains/vendors/application/actions/vendor-follow.actions'

export function VendorFollowButton({
  storeId,
  slug,
  initialFollowing,
  isAuthenticated,
  className,
}: {
  storeId: string
  slug: string
  initialFollowing: boolean
  isAuthenticated: boolean
  className?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [following, setFollowing] = useState(initialFollowing)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    if (!isAuthenticated) {
      toast({ title: 'Iniciá sesión', description: 'Necesitás una cuenta para seguir tiendas.' })
      return
    }

    // Optimistic update.
    const previous = following
    setFollowing(!previous)

    startTransition(async () => {
      const result = previous
        ? await unfollowVendorAction({ storeId, slug })
        : await followVendorAction({ storeId, slug })

      if (!result.success) {
        setFollowing(previous)
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }
      setFollowing(result.following)
      router.refresh()
    })
  }

  return (
    <Button
      type='button'
      onClick={toggle}
      disabled={isPending}
      variant={following ? 'outline' : 'default'}
      className={cn('rounded-full', className)}
    >
      {following ? (
        <>
          <Check className='mr-1.5 h-4 w-4' />
          Siguiendo
        </>
      ) : (
        <>
          <UserPlus className='mr-1.5 h-4 w-4' />
          Seguir
        </>
      )}
    </Button>
  )
}
