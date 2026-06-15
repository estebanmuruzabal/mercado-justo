import { AlertCircle, CheckCircle2, ShoppingBag } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import type { VendorFulfillmentPreviewDto } from '@/domains/logistics/application/dto/vendor-fulfillment.dto'
import { cn } from '@/shared/utils/utils'

import { FulfillmentMethodBadge } from './FulfillmentMethodBadge'
import { FulfillmentWindowChip } from './FulfillmentWindowChip'

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-4 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='text-right font-medium'>{value}</span>
    </div>
  )
}

export function FulfillmentAvailabilityPreview({
  preview,
  mode = 'vendor',
  className,
}: {
  preview: VendorFulfillmentPreviewDto
  mode?: 'vendor' | 'checkout'
  className?: string
}) {
  const title =
    mode === 'checkout'
      ? 'Así verá el comprador tus opciones de fulfillment'
      : 'Vista previa de disponibilidad'

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className='border-b bg-muted/20'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-1'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <ShoppingBag className='h-4 w-4 text-muted-foreground' />
              {title}
            </CardTitle>
            <CardDescription>
              {mode === 'checkout'
                ? `Opciones de ${preview.vendorName} en checkout (simulación).`
                : 'Resumen de métodos, ventanas y reglas operativas activas.'}
            </CardDescription>
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
              preview.isReadyForCheckout
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-800',
            )}
          >
            {preview.isReadyForCheckout ? (
              <CheckCircle2 className='h-3.5 w-3.5' />
            ) : (
              <AlertCircle className='h-3.5 w-3.5' />
            )}
            {preview.isReadyForCheckout ? 'Listo para checkout' : 'Incompleto'}
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6 p-5'>
        {!preview.isReadyForCheckout ? (
          <div className='rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>
            <p className='font-medium'>Pendientes antes de checkout</p>
            <ul className='mt-2 list-disc space-y-1 pl-5'>
              {preview.readinessIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <section className='space-y-3'>
          <h3 className='text-sm font-semibold'>Métodos habilitados</h3>
          {preview.methods.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Sin métodos habilitados.</p>
          ) : (
            <div className='flex flex-wrap gap-2'>
              {preview.methods.map((method) => (
                <FulfillmentMethodBadge
                  key={method.code}
                  label={method.label}
                  kind={method.kind}
                  provider={method.provider}
                  isDefault={method.isDefault}
                />
              ))}
            </div>
          )}
        </section>

        <section className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-3'>
            <h3 className='text-sm font-semibold'>Ventanas de pickup</h3>
            {preview.pickupWindows.length === 0 ? (
              <p className='text-sm text-muted-foreground'>Sin ventanas activas.</p>
            ) : (
              <div className='space-y-2'>
                {preview.pickupWindows.map((window) => (
                  <FulfillmentWindowChip key={window.id} window={window} />
                ))}
              </div>
            )}
          </div>

          <div className='space-y-3'>
            <h3 className='text-sm font-semibold'>Ventanas de delivery</h3>
            {preview.deliveryWindows.length === 0 ? (
              <p className='text-sm text-muted-foreground'>Sin ventanas activas.</p>
            ) : (
              <div className='space-y-2'>
                {preview.deliveryWindows.map((window) => (
                  <FulfillmentWindowChip key={window.id} window={window} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className='space-y-3 rounded-xl border bg-muted/20 p-4'>
          <h3 className='text-sm font-semibold'>Preferencias visibles</h3>
          <div className='space-y-2'>
            <PreferenceRow
              label='Dirección de pickup'
              value={preview.preferences.pickupAddress ?? 'Sin definir'}
            />
            {preview.preferences.deliveryAddress ? (
              <PreferenceRow
                label='Domicilio de entrega'
                value={preview.preferences.deliveryAddress}
              />
            ) : null}
            <PreferenceRow
              label='Radio delivery propio'
              value={
                preview.preferences.deliveryRadiusKm != null
                  ? `${preview.preferences.deliveryRadiusKm} km`
                  : 'No aplica'
              }
            />
            <PreferenceRow
              label='Confirmación del comprador'
              value={preview.preferences.requireBuyerConfirmation ? 'Requerida' : 'No requerida'}
            />
            <PreferenceRow
              label='Pickup mismo día'
              value={preview.preferences.allowSameDayPickup ? 'Permitido' : 'No permitido'}
            />
            <PreferenceRow
              label='Delivery mismo día'
              value={preview.preferences.allowSameDayDelivery ? 'Permitido' : 'No permitido'}
            />
            <PreferenceRow
              label='Preparación mínima'
              value={
                preview.preferences.minimumPreparationMinutes != null
                  ? `${preview.preferences.minimumPreparationMinutes} min`
                  : 'Sin mínimo'
              }
            />
            {preview.preferences.notes ? (
              <PreferenceRow label='Notas' value={preview.preferences.notes} />
            ) : null}
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
