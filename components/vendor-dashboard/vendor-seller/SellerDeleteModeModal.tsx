'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function SellerDeleteModeModal({
  open,
  onOpenChange,
  isDeleting,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  isDeleting: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Eliminar modo vendedor</DialogTitle>
          <DialogDescription className='space-y-2'>
            <p>
              Esta acción eliminará tu modo vendedor y te quitará el acceso al vendor dashboard. Además se
              limpiarán los datos relacionados a tu seller.
            </p>
            <p className='text-sm text-muted-foreground'>
              Podés perder acceso a publicaciones y operaciones asociadas.
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='pt-3'>
          <Button type='button' variant='outline' disabled={isDeleting} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type='button' variant='destructive' disabled={isDeleting} onClick={onConfirm}>
            {isDeleting ? 'Eliminando...' : 'Confirmar eliminación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

