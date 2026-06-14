'use client'

import { useMemo, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Power, PowerOff } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useToast } from '@/shared/hooks/use-toast'
import {
  ISO_WEEKDAY_LABELS,
  type IsoWeekday,
} from '@/domains/logistics/domain/window-schedule'
import type { DeliveryWindowRow, PickupWindowRow } from '@/domains/logistics/domain/types'
import type { VendorFulfillmentConfigurationDto } from '@/domains/vendors/application/queries/vendor-fulfillment.queries'
import {
  createVendorDeliveryWindowAction,
  createVendorPickupWindowAction,
  setVendorDeliveryWindowActiveAction,
  setVendorPickupWindowActiveAction,
  updateVendorDeliveryWindowAction,
  updateVendorPickupWindowAction,
} from '@/domains/vendors/application/actions/vendor-fulfillment.actions'
import { cn } from '@/shared/utils/utils'

import {
  formatWindowRange,
  vendorWindowFormSchema,
  type VendorWindowFormInput,
} from './vendor-fulfillment-settings-schema'

type WindowKind = 'pickup' | 'delivery'
type WindowRow = PickupWindowRow | DeliveryWindowRow

function emptyWindowForm(): VendorWindowFormInput {
  return { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }
}

function windowToForm(window: WindowRow): VendorWindowFormInput {
  return {
    dayOfWeek: window.dayOfWeek ?? 1,
    startTime: window.startTime.slice(0, 5),
    endTime: window.endTime.slice(0, 5),
  }
}

function VendorWindowEditor({
  title,
  description,
  kind,
  windows,
  disabled,
}: {
  title: string
  description: string
  kind: WindowKind
  windows: WindowRow[]
  disabled?: boolean
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<VendorWindowFormInput>({
    resolver: zodResolver(vendorWindowFormSchema),
    defaultValues: emptyWindowForm(),
  })

  const sortedWindows = useMemo(
    () =>
      [...windows].sort((a, b) => {
        const dayA = a.dayOfWeek ?? 0
        const dayB = b.dayOfWeek ?? 0
        if (dayA !== dayB) return dayA - dayB
        return a.startTime.localeCompare(b.startTime)
      }),
    [windows],
  )

  function resetForm() {
    setEditingId(null)
    form.reset(emptyWindowForm())
  }

  function startEdit(window: WindowRow) {
    setEditingId(window.id)
    form.reset(windowToForm(window))
  }

  function submitWindow(values: VendorWindowFormInput) {
    startTransition(async () => {
      const payload = {
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime,
        endTime: values.endTime,
      }

      const result =
        editingId == null
          ? kind === 'pickup'
            ? await createVendorPickupWindowAction(payload)
            : await createVendorDeliveryWindowAction(payload)
          : kind === 'pickup'
            ? await updateVendorPickupWindowAction(editingId, payload)
            : await updateVendorDeliveryWindowAction(editingId, payload)

      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }

      toast({
        title: editingId ? 'Ventana actualizada' : 'Ventana creada',
        description: 'Los cambios ya están disponibles en tu vista previa.',
      })
      resetForm()
      router.refresh()
    })
  }

  function toggleActive(window: WindowRow) {
    startTransition(async () => {
      const result =
        kind === 'pickup'
          ? await setVendorPickupWindowActiveAction(window.id, !window.isActive)
          : await setVendorDeliveryWindowActiveAction(window.id, !window.isActive)

      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }

      toast({
        title: window.isActive ? 'Ventana desactivada' : 'Ventana activada',
      })
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        {disabled ? (
          <p className='rounded-xl border border-dashed p-4 text-sm text-muted-foreground'>
            Habilitá un método de {kind === 'pickup' ? 'pickup' : 'delivery'} en Capacidades para
            gestionar ventanas horarias.
          </p>
        ) : (
          <>
            <form
              onSubmit={form.handleSubmit(submitWindow)}
              className='grid gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-4'
            >
              <div className='space-y-2 md:col-span-1'>
                <Label htmlFor={`${kind}-day`}>Día</Label>
                <select
                  id={`${kind}-day`}
                  className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                  value={form.watch('dayOfWeek')}
                  onChange={(event) =>
                    form.setValue('dayOfWeek', Number(event.target.value), { shouldDirty: true })
                  }
                >
                  {([1, 2, 3, 4, 5, 6, 7] as IsoWeekday[]).map((day) => (
                    <option key={day} value={day}>
                      {ISO_WEEKDAY_LABELS[day]}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor={`${kind}-start`}>Desde</Label>
                <Input id={`${kind}-start`} type='time' {...form.register('startTime')} />
              </div>

              <div className='space-y-2'>
                <Label htmlFor={`${kind}-end`}>Hasta</Label>
                <Input id={`${kind}-end`} type='time' {...form.register('endTime')} />
              </div>

              <div className='flex items-end gap-2'>
                <Button type='submit' disabled={isPending} className='w-full'>
                  {editingId ? (
                    <>
                      <Pencil className='mr-2 h-4 w-4' />
                      Actualizar
                    </>
                  ) : (
                    <>
                      <Plus className='mr-2 h-4 w-4' />
                      Agregar
                    </>
                  )}
                </Button>
                {editingId ? (
                  <Button type='button' variant='outline' onClick={resetForm} disabled={isPending}>
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>

            {sortedWindows.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                Todavía no definiste ventanas. Agregá al menos una franja horaria.
              </p>
            ) : (
              <div className='space-y-2'>
                {sortedWindows.map((window) => (
                  <div
                    key={window.id}
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4',
                      window.isActive ? 'bg-background' : 'bg-muted/30 opacity-70',
                    )}
                  >
                    <div>
                      <p className='text-sm font-medium'>{window.label}</p>
                      <p className='text-xs text-muted-foreground'>
                        {window.dayOfWeek
                          ? ISO_WEEKDAY_LABELS[window.dayOfWeek as IsoWeekday]
                          : 'Sin día'}{' '}
                        · {formatWindowRange(window.startTime, window.endTime)}
                        {!window.isActive ? ' · Inactiva' : ''}
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        disabled={isPending}
                        onClick={() => startEdit(window)}
                      >
                        <Pencil className='mr-1 h-3.5 w-3.5' />
                        Editar
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant={window.isActive ? 'secondary' : 'default'}
                        disabled={isPending}
                        onClick={() => toggleActive(window)}
                      >
                        {window.isActive ? (
                          <>
                            <PowerOff className='mr-1 h-3.5 w-3.5' />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Power className='mr-1 h-3.5 w-3.5' />
                            Activar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function VendorTimeWindowsPanel({
  configuration,
  hasPickup,
  hasDelivery,
}: {
  configuration: VendorFulfillmentConfigurationDto
  hasPickup: boolean
  hasDelivery: boolean
}) {
  return (
    <div className='space-y-6'>
      <VendorWindowEditor
        title='Ventanas de pickup'
        description='Definí los días y horarios en los que los clientes pueden retirar pedidos.'
        kind='pickup'
        windows={configuration.pickupWindows}
        disabled={!hasPickup}
      />
      <VendorWindowEditor
        title='Ventanas de delivery'
        description='Definí los días y horarios en los que podés entregar pedidos.'
        kind='delivery'
        windows={configuration.deliveryWindows}
        disabled={!hasDelivery}
      />
    </div>
  )
}
