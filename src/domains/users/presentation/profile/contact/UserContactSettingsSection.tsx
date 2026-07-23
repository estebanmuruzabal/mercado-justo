'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'

import { updateUserContactSettingsAction } from '@/domains/users/application/actions/update-user-contact.actions'
import {
  connectUserTelegramAction,
  getUserTelegramConnectionStatusAction,
} from '@/domains/users/application/actions/user-telegram.actions'
import type { UserContactSettingsDto } from '@/domains/users/application/dto/user-contact.dto'
import { useDebouncedValue } from '@/domains/marketplace/listings/presentation/components/listing-manager/step1/use-debounced-value'
import { TELEGRAM_LINK_TOKEN_TTL_MS } from '@/shared/telegram/telegram/constants'
import { isValidUserConnectDeepLink } from '@/shared/telegram/telegram/user-link-payload'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { cn } from '@/shared/utils/utils'

import type { SaveStatus } from '../messaging/MessagingSettingsCard'

const TELEGRAM_POLL_INTERVAL_MS = 2500

function SaveIndicator({ status, error }: { status: SaveStatus; error: string | null }) {
  if (status === 'saving') {
    return (
      <p className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Loader2 className='size-3 animate-spin' />
        Guardando…
      </p>
    )
  }
  if (status === 'saved') return <p className='text-xs text-muted-foreground'>Guardado</p>
  if (status === 'error' && error) return <p className='text-xs text-destructive'>{error}</p>
  return null
}

function useUserContactSettings(initialSettings: UserContactSettingsDto) {
  const [settings, setSettings] = useState(initialSettings)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const lastSavedRef = useRef(initialSettings)
  const isFirstRender = useRef(true)

  const debouncedSettings = useDebouncedValue(settings, 600)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const unchanged =
      debouncedSettings.phoneNumber === lastSavedRef.current.phoneNumber &&
      debouncedSettings.whatsappNumber === lastSavedRef.current.whatsappNumber &&
      debouncedSettings.telegramUsername === lastSavedRef.current.telegramUsername &&
      debouncedSettings.allowPhoneCalls === lastSavedRef.current.allowPhoneCalls &&
      debouncedSettings.allowWhatsappMessages === lastSavedRef.current.allowWhatsappMessages &&
      debouncedSettings.allowTelegramMessages === lastSavedRef.current.allowTelegramMessages &&
      debouncedSettings.allowEmailContact === lastSavedRef.current.allowEmailContact &&
      debouncedSettings.preferredContactHours === lastSavedRef.current.preferredContactHours

    if (unchanged) return

    setSaveStatus('saving')
    setSaveError(null)

    void (async () => {
      try {
        const saved = await updateUserContactSettingsAction({
          phoneNumber: debouncedSettings.phoneNumber,
          whatsappNumber: debouncedSettings.whatsappNumber,
          telegramUsername: debouncedSettings.telegramUsername,
          allowPhoneCalls: debouncedSettings.allowPhoneCalls,
          allowWhatsappMessages: debouncedSettings.allowWhatsappMessages,
          allowTelegramMessages: debouncedSettings.allowTelegramMessages,
          allowEmailContact: debouncedSettings.allowEmailContact,
          preferredContactHours: debouncedSettings.preferredContactHours,
        })
        lastSavedRef.current = saved
        setSettings(saved)
        setSaveStatus('saved')
      } catch (err) {
        setSaveStatus('error')
        setSaveError(err instanceof Error ? err.message : 'No se pudo guardar la configuración.')
      }
    })()
  }, [debouncedSettings])

  function patchSettings(next: Partial<UserContactSettingsDto>) {
    setSettings((current) => ({ ...current, ...next }))
  }

  const applyTelegramConnection = useCallback(
    (next: {
      telegramConnected: boolean
      telegramUsername: string | null
      telegramConnectedAt: string | null
      telegramUserId: string | null
      telegramChatId: string | null
    }) => {
      setSettings((current) => ({ ...current, ...next }))
      lastSavedRef.current = { ...lastSavedRef.current, ...next }
    },
    [],
  )

  return { settings, saveStatus, saveError, patchSettings, applyTelegramConnection }
}

export function UserContactSettingsSection({
  initialSettings,
}: {
  initialSettings: UserContactSettingsDto
}) {
  const { settings, saveStatus, saveError, patchSettings, applyTelegramConnection } =
    useUserContactSettings(initialSettings)
  const [connectStatus, setConnectStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [connectError, setConnectError] = useState<string | null>(null)
  const [isPollingTelegram, setIsPollingTelegram] = useState(false)
  const pollStartedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPollingTelegram) return

    pollStartedAtRef.current = pollStartedAtRef.current ?? Date.now()

    const poll = async () => {
      try {
        const status = await getUserTelegramConnectionStatusAction()
        if (status.telegramConnected) {
          applyTelegramConnection(status)
          setIsPollingTelegram(false)
          pollStartedAtRef.current = null
          setConnectStatus('idle')
        }
      } catch {
        // Keep polling until timeout; transient errors should not abort the flow.
      }
    }

    void poll()
    const interval = window.setInterval(() => {
      if (
        pollStartedAtRef.current &&
        Date.now() - pollStartedAtRef.current > TELEGRAM_LINK_TOKEN_TTL_MS
      ) {
        setIsPollingTelegram(false)
        pollStartedAtRef.current = null
        setConnectError('El enlace expiró. Generá uno nuevo tocando “Conectar Telegram”.')
        setConnectStatus('error')
        return
      }

      void poll()
    }, TELEGRAM_POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [isPollingTelegram, applyTelegramConnection])

  async function handleConnectTelegram() {
    setConnectStatus('loading')
    setConnectError(null)

    const result = await connectUserTelegramAction()
    if (!result.success) {
      setConnectStatus('error')
      setConnectError(result.error)
      return
    }

    if (!isValidUserConnectDeepLink(result.deepLink)) {
      setConnectStatus('error')
      setConnectError('El enlace generado no es válido. Intentá de nuevo.')
      return
    }

    setConnectStatus('idle')
    pollStartedAtRef.current = Date.now()
    setIsPollingTelegram(true)
    window.open(result.deepLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div className='space-y-4 rounded-xl border bg-muted/10 p-4 sm:p-5'>
        <div className='space-y-1'>
          <h3 className='text-lg font-semibold'>Métodos de contacto</h3>
          <p className='text-sm text-muted-foreground'>
            Información para que Mercado Justo u otros servicios puedan contactarte.
          </p>
          <SaveIndicator status={saveStatus} error={saveError} />
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='contact-phone'>Teléfono</Label>
            <Input
              id='contact-phone'
              type='tel'
              inputMode='tel'
              autoComplete='tel'
              placeholder='Ej: 11 1234 5678'
              value={settings.phoneNumber ?? ''}
              disabled={saveStatus === 'saving'}
              onChange={(event) => patchSettings({ phoneNumber: event.target.value || null })}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='contact-whatsapp'>WhatsApp</Label>
            <Input
              id='contact-whatsapp'
              type='tel'
              inputMode='tel'
              placeholder='Ej: 54911 1234 5678'
              value={settings.whatsappNumber ?? ''}
              disabled={saveStatus === 'saving'}
              onChange={(event) => patchSettings({ whatsappNumber: event.target.value || null })}
            />
          </div>
        </div>

        <div className='space-y-3 rounded-lg border bg-background p-4'>
          <div className='space-y-2'>
            <Label htmlFor='contact-telegram-username'>Usuario de Telegram</Label>
            <Input
              id='contact-telegram-username'
              placeholder='Ej: tu_usuario'
              value={settings.telegramUsername ?? ''}
              disabled={saveStatus === 'saving' || settings.telegramConnected}
              onChange={(event) =>
                patchSettings({ telegramUsername: event.target.value || null })
              }
            />
          </div>

          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Estado de conexión con Telegram</p>
              {settings.telegramConnected ? (
                <span className='inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700'>
                  <span aria-hidden>🟢</span>
                  Telegram conectado
                </span>
              ) : (
                <span className='inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600'>
                  No conectado
                </span>
              )}
            </div>

            <Button
              type='button'
              variant='outline'
              disabled={
                connectStatus === 'loading' ||
                isPollingTelegram ||
                settings.telegramConnected
              }
              onClick={() => void handleConnectTelegram()}
            >
              {connectStatus === 'loading' || isPollingTelegram ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' />
                  {isPollingTelegram ? 'Esperando confirmación…' : 'Conectando…'}
                </>
              ) : (
                'Conectar Telegram'
              )}
            </Button>
          </div>

          {connectStatus === 'error' && connectError ? (
            <p className='text-xs text-destructive'>{connectError}</p>
          ) : null}

          {isPollingTelegram ? (
            <p className='text-xs text-muted-foreground'>
              Abrí Telegram, iniciá el chat con el bot y tocá “Start”. Esta pantalla se
              actualizará sola cuando la vinculación se complete.
            </p>
          ) : !settings.telegramConnected ? (
            <p className='text-xs text-muted-foreground'>
              El enlace es válido por 15 minutos y solo se puede usar una vez.
            </p>
          ) : null}
        </div>
      </div>

      <div className='space-y-4 rounded-xl border bg-muted/10 p-4 sm:p-5'>
        <div className='space-y-1'>
          <h3 className='text-lg font-semibold'>Preferencias de contacto</h3>
          <p className='text-sm text-muted-foreground'>
            Elegí cómo querés que te contacten. Cada canal se puede activar o desactivar por
            separado.
          </p>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between gap-4 rounded-lg border bg-background p-4'>
            <div className='space-y-0.5'>
              <Label htmlFor='allow-phone-calls'>Permitir llamadas telefónicas</Label>
              <p className='text-xs text-muted-foreground'>
                Autorizás contacto telefónico al número registrado.
              </p>
            </div>
            <Switch
              id='allow-phone-calls'
              checked={settings.allowPhoneCalls}
              disabled={saveStatus === 'saving'}
              onCheckedChange={(allowPhoneCalls) => patchSettings({ allowPhoneCalls })}
            />
          </div>

          <div className='flex items-center justify-between gap-4 rounded-lg border bg-background p-4'>
            <div className='space-y-0.5'>
              <Label htmlFor='allow-whatsapp-messages'>Permitir mensajes por WhatsApp</Label>
              <p className='text-xs text-muted-foreground'>
                Autorizás mensajes al WhatsApp registrado.
              </p>
            </div>
            <Switch
              id='allow-whatsapp-messages'
              checked={settings.allowWhatsappMessages}
              disabled={saveStatus === 'saving'}
              onCheckedChange={(allowWhatsappMessages) => patchSettings({ allowWhatsappMessages })}
            />
          </div>

          <div className='flex items-center justify-between gap-4 rounded-lg border bg-background p-4'>
            <div className='space-y-0.5'>
              <Label htmlFor='allow-telegram-messages'>Permitir mensajes por Telegram</Label>
              <p className='text-xs text-muted-foreground'>
                Autorizás mensajes por Telegram (usuario o bot conectado).
              </p>
            </div>
            <Switch
              id='allow-telegram-messages'
              checked={settings.allowTelegramMessages}
              disabled={saveStatus === 'saving'}
              onCheckedChange={(allowTelegramMessages) => patchSettings({ allowTelegramMessages })}
            />
          </div>

          <div className='flex items-center justify-between gap-4 rounded-lg border bg-background p-4'>
            <div className='space-y-0.5'>
              <Label htmlFor='allow-email-contact'>Permitir contacto por email</Label>
              <p className='text-xs text-muted-foreground'>
                Autorizás contacto al email de tu cuenta.
              </p>
            </div>
            <Switch
              id='allow-email-contact'
              checked={settings.allowEmailContact}
              disabled={saveStatus === 'saving'}
              onCheckedChange={(allowEmailContact) => patchSettings({ allowEmailContact })}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='preferred-contact-hours'>Horario preferido de contacto (opcional)</Label>
          <Input
            id='preferred-contact-hours'
            placeholder='Ej: Lun a Vie, 10:00 a 18:00'
            value={settings.preferredContactHours ?? ''}
            disabled={saveStatus === 'saving'}
            onChange={(event) =>
              patchSettings({ preferredContactHours: event.target.value || null })
            }
          />
        </div>
      </div>
    </>
  )
}
