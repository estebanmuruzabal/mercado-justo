'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Bot, Loader2, ShoppingCart } from 'lucide-react'

import { activateDittoBotAction } from '@/domains/dittobots/application/actions/activate-ditto-bot.actions'
import { updateDittoBotDeviceSettingsAction } from '@/domains/dittobots/application/actions/update-ditto-bot-device-settings.actions'
import type { DittoBotInventoryUnitSummary } from '@/domains/dittobots/domain/ditto-bot-inventory-unit'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { CONTACT_PATH } from '@/shared/routing/routes'

function DeviceSettingsInline({ unit }: { unit: DittoBotInventoryUnitSummary }) {
  const router = useRouter()
  const [region, setRegion] = useState(unit.location.region ?? '')
  const [isPublic, setIsPublic] = useState(unit.isPublicOnMap)
  const [inherits, setInherits] = useState(unit.inheritsUserLocation)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save() {
    setPending(true)
    setMessage(null)
    const result = await updateDittoBotDeviceSettingsAction({
      unitId: unit.id,
      locationRegion: inherits ? null : region || null,
      inheritsUserLocation: inherits,
      isPublicOnMap: isPublic,
    })
    setPending(false)

    if (!result.success) {
      setMessage(result.error)
      return
    }

    setMessage('Configuración guardada.')
    router.refresh()
  }

  if (unit.status !== 'activated') return null

  return (
    <div className='mt-3 space-y-3 rounded-lg border bg-neutral-50 p-3 text-sm'>
      <p className='font-medium'>Configuración mínima</p>
      <div className='flex items-center justify-between gap-4'>
        <Label htmlFor={`inherit-${unit.id}`}>Heredar ubicación del usuario</Label>
        <Switch
          id={`inherit-${unit.id}`}
          checked={inherits}
          onCheckedChange={setInherits}
        />
      </div>
      {!inherits ? (
        <div className='grid gap-2'>
          <Label htmlFor={`region-${unit.id}`}>Región</Label>
          <Input
            id={`region-${unit.id}`}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder='Ej. Granja, Casa'
          />
        </div>
      ) : null}
      <div className='flex items-center justify-between gap-4'>
        <Label htmlFor={`public-${unit.id}`}>Mostrar en mapa comunitario</Label>
        <Switch id={`public-${unit.id}`} checked={isPublic} onCheckedChange={setIsPublic} />
      </div>
      <Button size='sm' disabled={pending} onClick={() => void save()}>
        {pending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
        Guardar
      </Button>
      {message ? <p className='text-xs text-muted-foreground'>{message}</p> : null}
    </div>
  )
}

export function MisDittoBotsPanel({ devices }: { devices: DittoBotInventoryUnitSummary[] }) {
  const router = useRouter()
  const [serial, setSerial] = useState('')
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleActivate(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const result = await activateDittoBotAction({ serialNumber: serial, activationCode: code })
    setPending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setSerial('')
    setCode('')
    router.refresh()
  }

  if (devices.length === 0) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bot className='h-5 w-5' />
              Mis DittoBots
            </CardTitle>
            <CardDescription>
              Activá tu dispositivo para acceder a protocolos y la red Grower.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm text-muted-foreground'>
              Todavía no tenés DittoBots activos. Podés comprar uno o activar el que ya tengas.
            </p>
            <div className='flex flex-wrap gap-3'>
              <Button asChild variant='outline'>
                <Link href={CONTACT_PATH}>
                  <ShoppingCart className='mr-2 h-4 w-4' />
                  Comprar DittoBot
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activar dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <form className='grid max-w-md gap-4' onSubmit={(e) => void handleActivate(e)}>
              <div className='grid gap-2'>
                <Label htmlFor='serial'>Número de serie</Label>
                <Input
                  id='serial'
                  required
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='code'>Código de activación</Label>
                <Input
                  id='code'
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              {error ? (
                <p className='text-sm text-destructive' role='alert'>
                  {error}
                </p>
              ) : null}
              <Button type='submit' disabled={pending}>
                {pending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                Activar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bot className='h-5 w-5' />
            Mis DittoBots ({devices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {devices.map((device) => (
            <div key={device.id} className='rounded-lg border p-4'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div>
                  <p className='font-mono text-sm font-medium'>{device.serialNumber}</p>
                  <p className='text-sm text-muted-foreground'>
                    {device.model}
                    {device.friendlyName ? ` · ${device.friendlyName}` : ''}
                  </p>
                </div>
                <span className='rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize'>
                  {device.status}
                </span>
              </div>
              <dl className='mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2'>
                <div>
                  <dt className='inline font-medium'>Activado: </dt>
                  <dd className='inline'>
                    {device.activatedAt
                      ? new Date(device.activatedAt).toLocaleString('es-AR')
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className='inline font-medium'>Región: </dt>
                  <dd className='inline'>{device.location.region ?? '—'}</dd>
                </div>
              </dl>
              <DeviceSettingsInline unit={device} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activar otro dispositivo</CardTitle>
        </CardHeader>
        <CardContent>
          <form className='grid max-w-md gap-4' onSubmit={(e) => void handleActivate(e)}>
            <div className='grid gap-2'>
              <Label htmlFor='serial2'>Número de serie</Label>
              <Input
                id='serial2'
                required
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='code2'>Código de activación</Label>
              <Input id='code2' required value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            {error ? (
              <p className='text-sm text-destructive' role='alert'>
                {error}
              </p>
            ) : null}
            <Button type='submit' disabled={pending}>
              {pending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              Activar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
