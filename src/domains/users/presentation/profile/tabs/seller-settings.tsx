'use client'

import { useRef, useState, useTransition } from 'react'

import { activateSellerMode } from '@/domains/vendors/application/actions/store.actions'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useToast } from '@/shared/hooks/use-toast'
import type { Store } from '@/domains/vendors/domain/store'

export function SellerSettings({
  store,
  onStoreCreated,
}: {
  store: Store | null
  onStoreCreated: (store: Store) => void
}) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const isActive = Boolean(store)
  const isLocked = isActive || isPending

  const handleCheckboxClick = () => {
    if (isLocked) {
      return
    }

    setError(null)
    setOpen(true)
  }

  const handleAccept = () => {
    const form = formRef.current

    if (!form) {
      return
    }

    const formData = new FormData(form)

    startTransition(async () => {
      setError(null)

      const result = await activateSellerMode(formData)

      if (!result.success || !result.store) {
        const message = result.success ? 'No se pudo activar el modo vendedor.' : result.error
        setError(message)
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
        return
      }

      onStoreCreated(result.store)
      setOpen(false)
      toast({
        title: 'Modo vendedor activado',
        description: 'Tu store quedó creada con el plan free y límite de 10 productos.',
      })
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Modo vendedor</h2>
              {isActive && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  Activo
                </span>
              )}
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Activá tu store para empezar a vender con un plan free y límite inicial de 10 productos.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={isActive}
              disabled={isLocked}
              onClick={(event) => {
                event.preventDefault()
                handleCheckboxClick()
              }}
              readOnly
              className="size-4 rounded border-border text-primary focus:ring-ring"
            />
            {isActive ? 'Modo vendedor activo' : 'Activar modo vendedor'}
          </label>
        </div>
      </div>

      <form ref={formRef} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="termsAccepted" value="true" />

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="store-name">Nombre del negocio</Label>
          <Input
            id="store-name"
            name="name"
            placeholder="Mi tienda"
            defaultValue={store?.name ?? ''}
            disabled={isLocked}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="store-address">Dirección</Label>
          <Input
            id="store-address"
            name="address"
            placeholder="Av. Siempre Viva 123"
            defaultValue={store?.address ?? ''}
            disabled={isLocked}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="store-latitude">Latitud</Label>
          <Input
            id="store-latitude"
            name="latitude"
            type="number"
            step="any"
            placeholder="-34.6037"
            defaultValue={store?.latitude ?? ''}
            disabled={isLocked}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="store-longitude">Longitud</Label>
          <Input
            id="store-longitude"
            name="longitude"
            type="number"
            step="any"
            placeholder="-58.3816"
            defaultValue={store?.longitude ?? ''}
            disabled={isLocked}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="store-mode">Modo</Label>
          <select
            id="store-mode"
            name="mode"
            defaultValue={store?.mode ?? 'online'}
            disabled={isLocked}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="online">Online</option>
            <option value="physical">Physical</option>
          </select>
        </div>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Antes de activar el modo vendedor</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                Este es un texto placeholder de términos y condiciones. Antes de continuar, el usuario
                acepta que su store quedará habilitada bajo el plan free, con límite inicial de 10
                productos, y que deberá cumplir las políticas aplicables de la plataforma.
              </p>
              <p>
                Podés reemplazar este contenido por tus términos legales reales cuando estén listos.
              </p>
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleAccept} disabled={isPending}>
              {isPending ? 'Activando...' : 'Aceptar y continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}