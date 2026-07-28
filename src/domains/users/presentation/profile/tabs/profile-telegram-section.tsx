'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Send, Unlink } from 'lucide-react'

import {
  connectTelegramAction,
  disconnectTelegramAction,
  getTelegramSettingsAction,
} from '@/domains/dittobots/application/actions/telegram.actions'
import type { UserTelegramSettings } from '@/domains/dittobots/domain/vendor-telegram-settings'
import { useToast } from '@/shared/hooks/use-toast'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

function formatConnectedAt(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ProfileTelegramSection({
  initialSettings,
  configured,
}: {
  initialSettings: UserTelegramSettings
  configured: boolean
}) {
  const { toast } = useToast()
  const [settings, setSettings] = useState(initialSettings)
  const [awaitingConnection, setAwaitingConnection] = useState(false)
  const [isConnecting, startConnecting] = useTransition()
  const [isDisconnecting, startDisconnecting] = useTransition()

  const applySettings = useCallback((next: UserTelegramSettings) => {
    setSettings(next)
  }, [])

  useEffect(() => {
    if (!awaitingConnection) return
    let active = true
    const startedAt = Date.now()

    const interval = setInterval(async () => {
      if (!active) return
      const res = await getTelegramSettingsAction()
      if (!active) return

      if (res.success && res.settings.connected) {
        applySettings(res.settings)
        setAwaitingConnection(false)
        toast({
          title: 'Telegram conectado',
          description: res.settings.username
            ? `Cuenta @${res.settings.username} vinculada.`
            : 'Tu cuenta quedó vinculada.',
        })
      } else if (Date.now() - startedAt > 120_000) {
        setAwaitingConnection(false)
      }
    }, 3000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [awaitingConnection, applySettings, toast])

  function handleConnect() {
    startConnecting(async () => {
      const res = await connectTelegramAction()
      if (!res.success) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' })
        return
      }
      window.open(res.deepLink, '_blank', 'noopener,noreferrer')
      setAwaitingConnection(true)
    })
  }

  function handleDisconnect() {
    startDisconnecting(async () => {
      const res = await disconnectTelegramAction()
      if (!res.success) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' })
        return
      }
      applySettings({
        ...settings,
        chatId: null,
        telegramUserId: null,
        username: null,
        firstName: null,
        connected: false,
        enabled: false,
        connectedAt: null,
        status: 'expired',
      })
      toast({ title: 'Telegram desconectado', description: 'Ya no vas a recibir mensajes del bot.' })
    })
  }

  async function refreshStatus() {
    const res = await getTelegramSettingsAction()
    if (res.success) applySettings(res.settings)
  }

  const busy = isConnecting || isDisconnecting
  const connectedAtLabel = formatConnectedAt(settings.connectedAt)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Telegram</CardTitle>
        <CardDescription>
          Vinculá tu cuenta de Telegram para recibir avisos desde Mercado Justo.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {!configured ? (
          <p className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800'>
            La integración con Telegram aún no está configurada en el servidor.
          </p>
        ) : null}

        {settings.connected ? (
          <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary' className='bg-emerald-100 text-emerald-700'>
                Conectado
              </Badge>
              <CheckCircle2 className='size-4 text-emerald-600' />
            </div>
            <dl className='space-y-2 text-sm'>
              <div className='flex justify-between gap-4'>
                <dt className='text-muted-foreground'>Usuario de Telegram</dt>
                <dd className='font-medium'>
                  {settings.username ? `@${settings.username}` : settings.firstName ?? '—'}
                </dd>
              </div>
              {connectedAtLabel ? (
                <div className='flex justify-between gap-4'>
                  <dt className='text-muted-foreground'>Fecha de conexión</dt>
                  <dd className='font-medium'>{connectedAtLabel}</dd>
                </div>
              ) : null}
            </dl>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleDisconnect}
              disabled={busy}
            >
              {isDisconnecting ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <Unlink className='size-4' />
              )}
              Desconectar
            </Button>
          </div>
        ) : (
          <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
            <Badge variant='outline' className='text-muted-foreground'>
              No conectado
            </Badge>
            <p className='text-sm text-muted-foreground'>
              Tocá el botón para abrir Telegram y confirmar la vinculación con un enlace seguro
              temporal.
            </p>
            <div className='flex flex-wrap items-center gap-2'>
              <Button type='button' onClick={handleConnect} disabled={busy || !configured}>
                {isConnecting ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Send className='size-4' />
                )}
                Conectar Telegram
              </Button>
              {awaitingConnection ? (
                <Button type='button' variant='ghost' size='sm' onClick={refreshStatus}>
                  Actualizar estado
                </Button>
              ) : null}
            </div>
            {awaitingConnection ? (
              <p className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Loader2 className='size-4 animate-spin' />
                Esperando que confirmes en Telegram…
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
