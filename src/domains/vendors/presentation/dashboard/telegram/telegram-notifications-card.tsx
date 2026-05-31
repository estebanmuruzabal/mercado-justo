'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Loader2,
  Send,
  Unlink,
} from 'lucide-react'

import {
  connectTelegramAction,
  disconnectTelegramAction,
  getTelegramSettingsAction,
  sendTelegramTestAction,
  updateTelegramPreferencesAction,
} from '@/domains/dittobots/application/actions/telegram.actions'
import type { TelegramPreferencesInput } from '@/shared/telegram/telegram/preferences-schema'
import type { VendorTelegramSettings } from '@/domains/dittobots/domain/vendor-telegram-settings'
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
import { Separator } from '@/shared/ui/separator'
import { Switch } from '@/shared/ui/switch'

type Draft = TelegramPreferencesInput

const PREFERENCE_ITEMS: Array<{
  key: keyof Omit<Draft, 'enabled'>
  label: string
  description: string
}> = [
  { key: 'notifyNewOrders', label: 'Nuevas ventas', description: 'Avisame cuando reciba un pedido.' },
  { key: 'notifyNewReviews', label: 'Nuevas reseñas', description: 'Avisame cuando dejen una reseña.' },
  { key: 'notifyNewFollowers', label: 'Nuevos seguidores', description: 'Avisame cuando me sigan.' },
  { key: 'notifyLowStock', label: 'Stock bajo', description: 'Avisame cuando un producto se esté agotando.' },
]

function toDraft(settings: VendorTelegramSettings): Draft {
  return {
    enabled: settings.enabled,
    notifyNewOrders: settings.notifyNewOrders,
    notifyNewReviews: settings.notifyNewReviews,
    notifyNewFollowers: settings.notifyNewFollowers,
    notifyLowStock: settings.notifyLowStock,
  }
}

function isDirty(settings: VendorTelegramSettings, draft: Draft): boolean {
  const base = toDraft(settings)
  return (Object.keys(draft) as Array<keyof Draft>).some((key) => base[key] !== draft[key])
}

export function TelegramNotificationsCard({
  initialSettings,
  configured,
}: {
  initialSettings: VendorTelegramSettings
  configured: boolean
}) {
  const { toast } = useToast()

  const [settings, setSettings] = useState<VendorTelegramSettings>(initialSettings)
  const [draft, setDraft] = useState<Draft>(() => toDraft(initialSettings))
  const [awaitingConnection, setAwaitingConnection] = useState(false)

  const [isConnecting, startConnecting] = useTransition()
  const [isSaving, startSaving] = useTransition()
  const [isTesting, startTesting] = useTransition()
  const [isDisconnecting, startDisconnecting] = useTransition()

  const applySettings = useCallback((next: VendorTelegramSettings) => {
    setSettings(next)
    setDraft(toDraft(next))
  }, [])

  // Poll for connection completion after the vendor opens the deep link.
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

  async function refreshStatus() {
    const res = await getTelegramSettingsAction()
    if (res.success) applySettings(res.settings)
  }

  function handleSavePreferences() {
    startSaving(async () => {
      const res = await updateTelegramPreferencesAction(draft)
      if (!res.success) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' })
        return
      }
      applySettings(res.settings)
      toast({ title: 'Listo', description: 'Preferencias guardadas.' })
    })
  }

  function handleTest() {
    startTesting(async () => {
      const res = await sendTelegramTestAction()
      if (!res.success) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Mensaje enviado', description: 'Revisá tu Telegram.' })
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
        username: null,
        connected: false,
        enabled: false,
        connectedAt: null,
      })
      toast({ title: 'Telegram desconectado', description: 'Ya no vas a recibir notificaciones.' })
    })
  }

  const dirty = isDirty(settings, draft)
  const busy = isConnecting || isSaving || isTesting || isDisconnecting

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <span className='flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600'>
            <Bell className='size-5' />
          </span>
          <div className='flex-1'>
            <CardTitle className='flex items-center gap-2'>
              Telegram
              <ConnectionBadge connected={settings.connected} />
            </CardTitle>
            <CardDescription>
              Recibí alertas de tu tienda directamente en Telegram.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {!configured && (
          <div className='flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800'>
            <AlertTriangle className='mt-0.5 size-4 shrink-0' />
            <p>La integración con Telegram aún no está configurada en el servidor.</p>
          </div>
        )}

        {/* Connection */}
        <section className='space-y-3'>
          {settings.connected ? (
            <div className='flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-3'>
                <CheckCircle2 className='size-5 text-emerald-600' />
                <div>
                  <p className='text-sm font-medium'>Cuenta conectada</p>
                  {settings.username ? (
                    <p className='text-sm text-muted-foreground'>@{settings.username}</p>
                  ) : null}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleTest}
                  disabled={busy || !settings.enabled}
                >
                  {isTesting ? <Loader2 className='size-4 animate-spin' /> : <Send className='size-4' />}
                  Enviar prueba
                </Button>
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
            </div>
          ) : (
            <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
              <p className='text-sm text-muted-foreground'>
                Conectá tu cuenta de Telegram para empezar a recibir notificaciones.
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
                {awaitingConnection && (
                  <Button type='button' variant='ghost' size='sm' onClick={refreshStatus}>
                    Actualizar estado
                  </Button>
                )}
              </div>
              {awaitingConnection && (
                <p className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Loader2 className='size-4 animate-spin' />
                  Esperando que confirmes en Telegram…
                </p>
              )}
            </div>
          )}
        </section>

        <Separator />

        {/* Preferences */}
        <section className='space-y-4'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm font-medium'>Notificaciones de Telegram</p>
              <p className='text-sm text-muted-foreground'>Activá o pausá todos los avisos.</p>
            </div>
            <Switch
              checked={draft.enabled}
              onCheckedChange={(checked) => setDraft((d) => ({ ...d, enabled: checked }))}
              disabled={busy}
              aria-label='Activar notificaciones de Telegram'
            />
          </div>

          <div className='space-y-3'>
            {PREFERENCE_ITEMS.map((item) => (
              <div key={item.key} className='flex items-center justify-between gap-4'>
                <div>
                  <p className='text-sm font-medium'>{item.label}</p>
                  <p className='text-sm text-muted-foreground'>{item.description}</p>
                </div>
                <Switch
                  checked={draft[item.key]}
                  onCheckedChange={(checked) => setDraft((d) => ({ ...d, [item.key]: checked }))}
                  disabled={busy || !draft.enabled}
                  aria-label={item.label}
                />
              </div>
            ))}
          </div>

          <div className='flex justify-end'>
            <Button type='button' onClick={handleSavePreferences} disabled={busy || !dirty}>
              {isSaving ? <Loader2 className='size-4 animate-spin' /> : null}
              {isSaving ? 'Guardando…' : 'Guardar preferencias'}
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <Badge variant='secondary' className='bg-emerald-100 text-emerald-700'>
      Conectado
    </Badge>
  ) : (
    <Badge variant='outline' className='text-muted-foreground'>
      Desconectado
    </Badge>
  )
}
