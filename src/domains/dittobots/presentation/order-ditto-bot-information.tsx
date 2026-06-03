'use client'

import { Copy } from 'lucide-react'

import type { OrderDittoBotInfoDto } from '../application/dto/order-ditto-bot-info.dto'
import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/hooks/use-toast'

export function OrderDittoBotInformation({
  units,
  viewer,
}: {
  units: OrderDittoBotInfoDto[]
  viewer: 'buyer' | 'vendor'
}) {
  const { toast } = useToast()
  if (units.length === 0) return null

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value)
    toast({ title: 'Copiado' })
  }

  return (
    <section className='space-y-3 rounded-md border bg-muted/30 p-4'>
      <div>
        <h3 className='text-sm font-semibold'>DittoBot Information</h3>
        <p className='text-xs text-muted-foreground'>
          {viewer === 'buyer'
            ? 'Datos necesarios para activar tu DittoBot.'
            : 'Información operativa de la unidad vendida.'}
        </p>
      </div>

      <div className='space-y-4'>
        {units.map((unit) => (
          <div key={unit.id} className='space-y-3 rounded-md border bg-background p-3'>
            <div className='text-sm font-medium'>{unit.productName}</div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <InfoField label='Serial Number' value={unit.serialNumber} />
              <InfoField label='Activation Code' value={unit.activationCode} />
            </div>

            <div className='grid gap-3 text-xs text-muted-foreground sm:grid-cols-3'>
              <InfoField label='Firmware Version' value={unit.firmwareVersion ?? 'Pendiente'} muted />
              <InfoField label='Activation Status' value={unit.status} muted />
              <InfoField label='Activated At' value={unit.activatedAt ?? 'Pendiente'} muted />
            </div>

            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => void copyValue(unit.serialNumber)}
              >
                <Copy className='size-4' aria-hidden />
                Copiar Serial
              </Button>
              {unit.canCopyActivationCode ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => void copyValue(unit.activationCode)}
                >
                  <Copy className='size-4' aria-hidden />
                  Copiar Código
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function InfoField({
  label,
  value,
  muted = false,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className='min-w-0 space-y-1'>
      <div className='text-xs font-medium text-muted-foreground'>{label}:</div>
      <div className={muted ? 'break-words text-xs text-muted-foreground' : 'break-words font-mono text-sm'}>
        {value}
      </div>
    </div>
  )
}
