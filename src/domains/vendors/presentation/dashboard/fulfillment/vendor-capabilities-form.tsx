'use client'

import type { UseFormReturn } from 'react-hook-form'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { FulfillmentMethodCode } from '@/domains/logistics/domain/types'
import type { VendorFulfillmentConfigurationDto } from '@/domains/vendors/application/queries/vendor-fulfillment.queries'
import { cn } from '@/shared/utils/utils'

import type { VendorCapabilitiesFormInput } from './vendor-fulfillment-settings-schema'

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function providerLabel(provider: 'seller' | 'dittovan') {
  return provider === 'dittovan' ? 'DittoVan / Mercado Justo' : 'Propio del vendedor'
}

export function VendorCapabilitiesForm({
  form,
  configuration,
}: {
  form: UseFormReturn<VendorCapabilitiesFormInput>
  configuration: VendorFulfillmentConfigurationDto
}) {
  const enabledMethodCodes = form.watch('enabledMethodCodes') ?? []
  const autoUseStoreAddressForPickup = form.watch('autoUseStoreAddressForPickup') ?? true

  const hasPickup =
    enabledMethodCodes.includes('pickup_seller') ||
    enabledMethodCodes.includes('pickup_dittovan')
  const hasSellerDelivery = enabledMethodCodes.includes('delivery_seller')

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Métodos de fulfillment habilitados</CardTitle>
          <CardDescription>
            Elegí qué modalidades logísticas ofrece tu tienda.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 sm:grid-cols-2'>
          {configuration.methods.map((method) => {
            const checked = enabledMethodCodes.includes(method.code)
            return (
              <label
                key={method.code}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                  checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
                )}
              >
                <input
                  type='checkbox'
                  className='mt-1'
                  checked={checked}
                  onChange={() => {
                    form.setValue(
                      'enabledMethodCodes',
                      toggleValue(enabledMethodCodes, method.code),
                      { shouldDirty: true },
                    )
                  }}
                />
                <span className='space-y-1'>
                  <span className='block text-sm font-medium'>{method.label}</span>
                  <span className='block text-xs text-muted-foreground'>
                    {method.kind === 'pickup' ? 'Pickup' : 'Delivery'} ·{' '}
                    {providerLabel(method.provider)}
                  </span>
                </span>
              </label>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dirección y cobertura</CardTitle>
          <CardDescription>
            Configurá dónde retiran los clientes y hasta dónde llegás con delivery propio.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {hasPickup ? (
            <div className='space-y-3'>
              <label className='flex items-center gap-3 text-sm'>
                <input
                  type='checkbox'
                  checked={autoUseStoreAddressForPickup}
                  onChange={(event) =>
                    form.setValue('autoUseStoreAddressForPickup', event.target.checked, {
                      shouldDirty: true,
                    })
                  }
                />
                Usar la dirección de la tienda como pickup por defecto
              </label>

              {!autoUseStoreAddressForPickup ? (
                <div className='space-y-2'>
                  <Label htmlFor='pickupAddress'>Dirección de pickup</Label>
                  <Input id='pickupAddress' {...form.register('pickupAddress')} />
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  Dirección actual de la tienda: {configuration.storeAddress ?? 'Sin definir'}
                </p>
              )}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Habilitá un método de pickup para configurar la dirección de retiro.
            </p>
          )}

          {hasSellerDelivery ? (
            <div className='space-y-2'>
              <Label htmlFor='deliveryRadiusKm'>Radio de delivery propio (km)</Label>
              <Input
                id='deliveryRadiusKm'
                type='number'
                min={0}
                step='0.1'
                placeholder='Ej: 5'
                {...form.register('deliveryRadiusKm')}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export function getEnabledMethodCodes(form: UseFormReturn<VendorCapabilitiesFormInput>) {
  return (form.getValues('enabledMethodCodes') ?? []) as FulfillmentMethodCode[]
}
