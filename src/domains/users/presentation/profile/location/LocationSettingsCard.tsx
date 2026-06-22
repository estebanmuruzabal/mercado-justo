'use client'

import { Loader2, MapPin } from 'lucide-react'

import type { UserLocationSettingsDto } from '@/domains/users/application/dto/user-location.dto'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'

import { LocationPickerMap } from './LocationPickerMap'
import { LocationPrecisionSlider } from './LocationPrecisionSlider'
import { LocationPreviewMap } from './LocationPreviewMap'
import { useGlobalGeolocation } from './use-global-geolocation'
import { useUserLocationSettings } from './use-user-location-settings'

function SaveIndicator({ status, error }: { status: string; error: string | null }) {
  if (status === 'saving') {
    return (
      <p className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Loader2 className='size-3 animate-spin' />
        Guardando…
      </p>
    )
  }
  if (status === 'saved') {
    return <p className='text-xs text-muted-foreground'>Guardado</p>
  }
  if (status === 'error' && error) {
    return <p className='text-xs text-destructive'>{error}</p>
  }
  return null
}

export function LocationSettingsCard({
  initialSettings,
}: {
  initialSettings: UserLocationSettingsDto
}) {
  const geo = useGlobalGeolocation()
  const {
    settings,
    preview,
    saveStatus,
    saveError,
    setCoordinates,
    setLocationVisibility,
    setLocationPrivacy,
  } = useUserLocationSettings(initialSettings)

  const coords =
    settings.latitude != null && settings.longitude != null
      ? { latitude: settings.latitude, longitude: settings.longitude }
      : null

  async function handleUseCurrentLocation() {
    try {
      const next = await geo.requestLocation()
      setCoordinates(next)
    } catch {
      // geo.error already set in hook
    }
  }

  return (
    <div className='space-y-6 rounded-xl border bg-muted/10 p-4 sm:p-5'>
      <div className='space-y-1'>
        <h3 className='text-lg font-semibold'>Configuración de Ubicación</h3>
        <p className='text-sm text-muted-foreground'>
          Elegí dónde estás y cómo querés que otros usuarios vean tu ubicación pública.
        </p>
        <SaveIndicator status={saveStatus} error={saveError} />
      </div>

      <div className='space-y-3'>
        <Button
          type='button'
          variant='outline'
          className='w-full sm:w-auto'
          disabled={geo.status === 'requesting' || saveStatus === 'saving'}
          onClick={() => void handleUseCurrentLocation()}
        >
          {geo.status === 'requesting' ? (
            <Loader2 className='mr-2 size-4 animate-spin' />
          ) : (
            <MapPin className='mr-2 size-4' />
          )}
          Usar mi ubicación actual
        </Button>
        {geo.error ? <p className='text-sm text-destructive'>{geo.error}</p> : null}
        {geo.status === 'requesting' ? (
          <p className='text-sm text-muted-foreground'>Obteniendo tu ubicación…</p>
        ) : null}
        {geo.status === 'granted' && coords ? (
          <p className='text-sm text-muted-foreground'>
            Ubicación obtenida ({coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)})
          </p>
        ) : null}

        <LocationPickerMap value={coords} onChange={setCoordinates} />
        <p className='text-xs text-muted-foreground'>
          Podés mover el pin o tocar el mapa para ajustar tu ubicación.
        </p>
      </div>

      <div className='flex items-center justify-between gap-4 rounded-lg border bg-background p-4'>
        <div className='space-y-0.5'>
          <Label htmlFor='location-visibility'>Mostrar mi ubicación públicamente</Label>
          <p className='text-xs text-muted-foreground'>
            Si está desactivado, tu ubicación se guarda pero no se muestra a otros usuarios.
          </p>
        </div>
        <Switch
          id='location-visibility'
          checked={settings.locationVisibility}
          disabled={saveStatus === 'saving'}
          onCheckedChange={setLocationVisibility}
        />
      </div>

      <LocationPrecisionSlider
        value={settings.locationPrivacy}
        disabled={saveStatus === 'saving'}
        onChange={setLocationPrivacy}
      />

      <div className='space-y-2'>
        <Label>Así verán tu ubicación otros usuarios</Label>
        <LocationPreviewMap
          preview={preview}
          isResolvingCity={saveStatus === 'saving' && settings.locationPrivacy.mode === 'city'}
        />
      </div>
    </div>
  )
}
