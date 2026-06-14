'use client'

import type { UseFormReturn } from 'react-hook-form'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import type { FulfillmentMethodCode } from '@/domains/logistics/domain/types'
import type { VendorFulfillmentConfigurationDto } from '@/domains/vendors/application/queries/vendor-fulfillment.queries'

import type { VendorPreferencesFormInput } from './vendor-fulfillment-settings-schema'

export function VendorPreferencesForm({
  form,
  configuration,
  enabledMethodCodes,
}: {
  form: UseFormReturn<VendorPreferencesFormInput>
  configuration: VendorFulfillmentConfigurationDto
  enabledMethodCodes: FulfillmentMethodCode[]
}) {
  const enabledMethods = configuration.methods.filter((method) =>
    enabledMethodCodes.includes(method.code),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias de fulfillment</CardTitle>
        <CardDescription>
          Definí reglas operativas y el método preferido para tus pedidos.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='space-y-2'>
          <Label htmlFor='defaultMethodCode'>Método preferido</Label>
          <select
            id='defaultMethodCode'
            className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            value={form.watch('defaultMethodCode') ?? ''}
            onChange={(event) =>
              form.setValue(
                'defaultMethodCode',
                event.target.value ? (event.target.value as FulfillmentMethodCode) : null,
                { shouldDirty: true },
              )
            }
          >
            <option value=''>Sin preferencia</option>
            {enabledMethods.map((method) => (
              <option key={method.code} value={method.code}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <label className='flex items-center gap-3 rounded-xl border p-3 text-sm'>
            <input
              type='checkbox'
              checked={form.watch('requireBuyerConfirmation') ?? false}
              onChange={(event) =>
                form.setValue('requireBuyerConfirmation', event.target.checked, { shouldDirty: true })
              }
            />
            Requerir confirmación del comprador
          </label>

          <label className='flex items-center gap-3 rounded-xl border p-3 text-sm'>
            <input
              type='checkbox'
              checked={form.watch('allowSameDayPickup') ?? false}
              onChange={(event) =>
                form.setValue('allowSameDayPickup', event.target.checked, { shouldDirty: true })
              }
            />
            Permitir pickup el mismo día
          </label>

          <label className='flex items-center gap-3 rounded-xl border p-3 text-sm'>
            <input
              type='checkbox'
              checked={form.watch('allowSameDayDelivery') ?? false}
              onChange={(event) =>
                form.setValue('allowSameDayDelivery', event.target.checked, { shouldDirty: true })
              }
            />
            Permitir delivery el mismo día
          </label>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='minimumPreparationMinutes'>Tiempo mínimo de preparación (minutos)</Label>
          <Input
            id='minimumPreparationMinutes'
            type='number'
            min={0}
            step={1}
            placeholder='Ej: 120'
            {...form.register('minimumPreparationMinutes')}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='notes'>Notas operativas</Label>
          <Textarea
            id='notes'
            rows={4}
            placeholder='Ej: Coordinar pickup con 2 horas de anticipación.'
            {...form.register('notes')}
          />
        </div>
      </CardContent>
    </Card>
  )
}
