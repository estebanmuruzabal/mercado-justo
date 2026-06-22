'use client'

import { useEffect, useRef, useState } from 'react'

import { updateUserMessagingSettingsAction } from '@/domains/users/application/actions/update-user-messaging-settings.actions'
import type { UserMessagingSettingsDto } from '@/domains/users/application/dto/user-messaging.dto'
import { useDebouncedValue } from '@/domains/marketplace/listings/presentation/components/listing-manager/step1/use-debounced-value'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useUserMessagingSettings(initialSettings: UserMessagingSettingsDto) {
  const [settings, setSettings] = useState(initialSettings)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const lastSavedRef = useRef(initialSettings)
  const isFirstRender = useRef(true)

  const debouncedSettings = useDebouncedValue(settings, 500)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (debouncedSettings.allowDirectMessages === lastSavedRef.current.allowDirectMessages) {
      return
    }

    setSaveStatus('saving')
    setSaveError(null)

    void (async () => {
      try {
        const saved = await updateUserMessagingSettingsAction({
          allowDirectMessages: debouncedSettings.allowDirectMessages,
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

  function setAllowDirectMessages(allowDirectMessages: boolean) {
    setSettings((current) => ({ ...current, allowDirectMessages }))
  }

  return {
    settings,
    saveStatus,
    saveError,
    setAllowDirectMessages,
  }
}

export function MessagingSettingsCard({
  initialSettings,
}: {
  initialSettings: UserMessagingSettingsDto
}) {
  const { settings, saveStatus, saveError, setAllowDirectMessages } =
    useUserMessagingSettings(initialSettings)

  return (
    <div className='space-y-4 rounded-xl border bg-muted/10 p-4 sm:p-5'>
      <div className='space-y-1'>
        <h3 className='text-lg font-semibold'>Configuración de Mensajes</h3>
        <p className='text-sm text-muted-foreground'>
          Controlá si otros usuarios pueden iniciar conversaciones nuevas con vos.
        </p>
        {saveStatus === 'saving' ? (
          <p className='text-xs text-muted-foreground'>Guardando…</p>
        ) : null}
        {saveStatus === 'saved' ? (
          <p className='text-xs text-muted-foreground'>Guardado</p>
        ) : null}
        {saveStatus === 'error' && saveError ? (
          <p className='text-xs text-destructive'>{saveError}</p>
        ) : null}
      </div>

      <div className='flex items-center justify-between gap-4 rounded-lg border bg-background p-4'>
        <div className='space-y-0.5'>
          <Label htmlFor='allow-direct-messages'>Permitir que otros usuarios me envíen mensajes</Label>
          <p className='text-xs text-muted-foreground'>
            Si está desactivado, no aparecés en Nuevo chat. Las conversaciones existentes siguen
            visibles.
          </p>
        </div>
        <Switch
          id='allow-direct-messages'
          checked={settings.allowDirectMessages}
          disabled={saveStatus === 'saving'}
          onCheckedChange={setAllowDirectMessages}
        />
      </div>
    </div>
  )
}
