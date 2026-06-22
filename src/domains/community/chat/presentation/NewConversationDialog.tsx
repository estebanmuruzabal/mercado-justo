'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SquarePen } from 'lucide-react'

import { openDirectConversationAction } from '@/domains/community/chat/application/actions/messages.actions'
import type { MessageableUserDto } from '@/domains/community/chat/application/dto/messageable-user.dto'
import { messageConversationPath } from '@/shared/routing/routes'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'

import { UserPickerList } from './UserPickerList'
import { useIsLgScreen } from './hooks/use-is-lg-screen'

function NewConversationContent({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(user: MessageableUserDto) {
    setOpening(true)
    setError(null)
    try {
      const conversationId = await openDirectConversationAction(user.id)
      onOpenChange(false)
      router.push(messageConversationPath(conversationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la conversación.')
    } finally {
      setOpening(false)
    }
  }

  return (
    <div className='space-y-3'>
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      <UserPickerList onSelect={(user) => void handleSelect(user)} />
      {opening ? <p className='text-xs text-muted-foreground'>Abriendo conversación…</p> : null}
    </div>
  )
}

export function NewConversationDialog({ variant = 'default' }: { variant?: 'default' | 'icon' }) {
  const [open, setOpen] = useState(false)
  const isLg = useIsLgScreen()

  const trigger =
    variant === 'icon' ? (
      <Button type='button' size='icon' variant='ghost' aria-label='Nuevo chat'>
        <SquarePen className='size-5' />
      </Button>
    ) : (
      <Button type='button' size='sm'>
        Nuevo chat
      </Button>
    )

  if (isLg) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Nuevo chat</DialogTitle>
          </DialogHeader>
          <NewConversationContent onOpenChange={setOpen} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side='bottom' className='max-h-[85vh] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Nuevo chat</SheetTitle>
        </SheetHeader>
        <div className='mt-4'>
          <NewConversationContent onOpenChange={setOpen} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
