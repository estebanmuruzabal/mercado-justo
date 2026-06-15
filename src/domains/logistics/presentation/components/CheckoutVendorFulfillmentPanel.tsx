'use client'

import { useMemo, useState } from 'react'

import type { FulfillmentMethodCode } from '@/domains/logistics/domain/types'
import type {
  CheckoutVendorFulfillmentDto,
  CheckoutVendorFulfillmentSelectionDto,
} from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import {
  buildDefaultCheckoutSelection,
  isDeliveryMethodCode,
  resolveNextScheduledDate,
  windowDayFromLabel,
} from '@/domains/logistics/domain/policies/checkout-fulfillment-policy'
import { FulfillmentWindowChip } from '@/domains/logistics/presentation/components/FulfillmentWindowChip'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { PillOptions } from '@/shared/ui/pill-options'
import { cn } from '@/shared/utils/utils'

const FULFILLMENT_PILL_OPTIONS = ['Envío', 'Retiro', 'Coordinar'] as const
type FulfillmentPillOption = (typeof FULFILLMENT_PILL_OPTIONS)[number]

function methodKind(code: FulfillmentMethodCode): 'pickup' | 'delivery' {
  return code.startsWith('pickup_') ? 'pickup' : 'delivery'
}

function preferredMethodCode(
  methods: CheckoutVendorFulfillmentDto['methods'],
  kind: 'pickup' | 'delivery',
): FulfillmentMethodCode | undefined {
  const filtered = methods.filter((method) => method.kind === kind)
  return (filtered.find((method) => method.isDefault) ?? filtered[0])?.code
}

export function CheckoutVendorFulfillmentPanel({
  vendor,
  selection,
  deliveryAddress,
  onChange,
}: {
  vendor: CheckoutVendorFulfillmentDto
  selection: CheckoutVendorFulfillmentSelectionDto | undefined
  deliveryAddress: string | null
  onChange: (selection: CheckoutVendorFulfillmentSelectionDto) => void
}) {
  const [coordinateSelected, setCoordinateSelected] = useState(false)
  const currentSelection = selection ?? buildDefaultCheckoutSelection(vendor) ?? undefined
  const selectedMethodCode = currentSelection?.methodCode
  const selectedKind = selectedMethodCode ? methodKind(selectedMethodCode) : null
  const windows =
    selectedKind === 'pickup'
      ? vendor.pickupWindows
      : selectedKind === 'delivery'
        ? vendor.deliveryWindows
        : []

  const pillOptions = useMemo((): FulfillmentPillOption[] => {
    const options: FulfillmentPillOption[] = []
    if (vendor.methods.some((method) => method.kind === 'delivery')) options.push('Envío')
    if (vendor.methods.some((method) => method.kind === 'pickup')) options.push('Retiro')
    if (vendor.methods.length > 0) options.push('Coordinar')
    return options
  }, [vendor.methods])

  const pillValue = useMemo((): FulfillmentPillOption => {
    if (coordinateSelected && pillOptions.includes('Coordinar')) return 'Coordinar'
    if (selectedMethodCode) {
      const kind = methodKind(selectedMethodCode)
      if (kind === 'pickup' && pillOptions.includes('Retiro')) return 'Retiro'
      if (kind === 'delivery' && pillOptions.includes('Envío')) return 'Envío'
    }
    return pillOptions[0] ?? 'Envío'
  }, [coordinateSelected, pillOptions, selectedMethodCode])

  function updateSelection(next: Partial<CheckoutVendorFulfillmentSelectionDto>) {
    if (!currentSelection) return
    onChange({ ...currentSelection, ...next })
  }

  function selectMethod(methodCode: FulfillmentMethodCode) {
    const kind = methodKind(methodCode)
    const nextWindows = kind === 'pickup' ? vendor.pickupWindows : vendor.deliveryWindows
    const window = nextWindows[0]
    if (!window) return

    const dayOfWeek = windowDayFromLabel(window.dayLabel)
    if (!dayOfWeek) return

    const [startTime, endTime] = window.timeRange.split(' — ')

    onChange({
      vendorId: vendor.vendorId,
      methodCode,
      windowId: window.id,
      scheduledDate: resolveNextScheduledDate({
        dayOfWeek,
        minimumPreparationMinutes: vendor.preview.preferences.minimumPreparationMinutes,
        allowSameDay:
          kind === 'pickup'
            ? vendor.preview.preferences.allowSameDayPickup
            : vendor.preview.preferences.allowSameDayDelivery,
      }),
      startTime: startTime ?? '09:00',
      endTime: endTime ?? '12:00',
      pickupAddress: vendor.preview.preferences.pickupAddress,
      deliveryAddress: isDeliveryMethodCode(methodCode) ? deliveryAddress : null,
    })
  }

  function selectWindow(windowId: string) {
    const window = windows.find((item) => item.id === windowId)
    if (!window || !selectedMethodCode) return

    const dayOfWeek = windowDayFromLabel(window.dayLabel)
    if (!dayOfWeek) return

    const [startTime, endTime] = window.timeRange.split(' — ')

    updateSelection({
      windowId,
      scheduledDate: resolveNextScheduledDate({
        dayOfWeek,
        minimumPreparationMinutes: vendor.preview.preferences.minimumPreparationMinutes,
        allowSameDay:
          selectedKind === 'pickup'
            ? vendor.preview.preferences.allowSameDayPickup
            : vendor.preview.preferences.allowSameDayDelivery,
      }),
      startTime: startTime ?? '09:00',
      endTime: endTime ?? '12:00',
    })
  }

  function handlePillChange(option: FulfillmentPillOption) {
    setCoordinateSelected(option === 'Coordinar')

    if (option === 'Coordinar') {
      const methodCode =
        (vendor.defaultMethodCode &&
        vendor.methods.some((method) => method.code === vendor.defaultMethodCode)
          ? vendor.defaultMethodCode
          : null) ?? vendor.methods[0]?.code
      if (methodCode) selectMethod(methodCode)
      return
    }

    const methodCode = preferredMethodCode(
      vendor.methods,
      option === 'Envío' ? 'delivery' : 'pickup',
    )
    if (methodCode) selectMethod(methodCode)
  }

  if (!vendor.preview.isReadyForCheckout) {
    return (
      <Card className='border-amber-200 bg-amber-50'>
        <CardHeader>
          <CardTitle className='text-base'>{vendor.vendorName}</CardTitle>
          <CardDescription>
            Este vendedor todavía no completó su configuración de fulfillment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className='list-disc space-y-1 pl-5 text-sm text-amber-900'>
            {vendor.preview.readinessIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {/* <CardHeader>
        <CardTitle className='text-base'>{vendor.vendorName}</CardTitle>
        <CardDescription>
          {vendor.itemCount} artículo{vendor.itemCount === 1 ? '' : 's'} · Elegí cómo recibir este
          pedido
        </CardDescription>
      </CardHeader> */}
      <CardContent className='space-y-5'>
        <div className='space-y-2'>
          <p className='text-sm font-medium'>Método de fulfillment</p>
          <PillOptions
            options={pillOptions}
            value={pillValue}
            onSelectChange={handlePillChange}
            className='w-full'
            disabled={pillOptions.length === 0}
          />
        </div>

        {selectedMethodCode ? (
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Ventana horaria</p>
            {windows.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No hay ventanas activas para este método.</p>
            ) : (
              <div className='grid gap-2 sm:grid-cols-2'>
                {windows.map((window) => {
                  const selected = currentSelection?.windowId === window.id
                  return (
                    <button
                      key={window.id}
                      type='button'
                      onClick={() => selectWindow(window.id)}
                      className={cn('text-left', selected ? 'opacity-100' : 'opacity-80 hover:opacity-100')}
                    >
                      <FulfillmentWindowChip
                        window={window}
                        className={cn(selected && 'ring-2 ring-primary ring-offset-2')}
                      />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}

        {selectedMethodCode && methodKind(selectedMethodCode) === 'pickup' ? (
          <div className='rounded-xl border bg-muted/20 p-3 text-sm'>
            <p className='font-medium'>Retiro en</p>
            <p className='text-muted-foreground'>
              {vendor.preview.preferences.pickupAddress ?? 'Sin dirección configurada'}
            </p>
            {currentSelection?.scheduledDate ? (
              <p className='mt-2 text-muted-foreground'>
                Próxima fecha estimada: {currentSelection.scheduledDate}
              </p>
            ) : null}
          </div>
        ) : null}

        {selectedMethodCode && isDeliveryMethodCode(selectedMethodCode) ? (
          <div className='rounded-xl border bg-muted/20 p-3 text-sm'>
            <p className='font-medium'>Entrega en tu domicilio</p>
            <p className='text-muted-foreground'>
              {deliveryAddress?.trim() ? deliveryAddress : 'Completá tu domicilio arriba para continuar.'}
            </p>
            {currentSelection?.scheduledDate ? (
              <p className='mt-2 text-muted-foreground'>
                Próxima fecha estimada: {currentSelection.scheduledDate}
              </p>
            ) : null}
          </div>
        ) : null}

        {vendor.preview.preferences.requireBuyerConfirmation ? (
          <p className='text-xs text-muted-foreground'>
            Este vendedor requiere confirmación del comprador antes de preparar el pedido.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
